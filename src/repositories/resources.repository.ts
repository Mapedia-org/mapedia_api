import { node, Query, relation } from 'cypher-query-builder';
import { map, prop } from 'ramda';
import * as shortid from 'shortid';
import { Concept, ConceptLabel } from '../entities/Concept';
import { Domain, DomainLabel } from '../entities/Domain';
import { ConceptBelongsToDomainLabel } from '../entities/relationships/ConceptBelongsToDomain';
import {
  ResourceBelongsToDomain,
  ResourceBelongsToDomainLabel,
} from '../entities/relationships/ResourceBelongsToDomain';
import {
  ResourceBelongsToResource,
  ResourceBelongsToResourceLabel,
} from '../entities/relationships/ResourceBelongsToResource';
import { ResourceCoversConcept, ResourceCoversConceptLabel } from '../entities/relationships/ResourceCoversConcept';
import {
  ResourceHasNextResource,
  ResourceHasNextResourceLabel,
} from '../entities/relationships/ResourceHasNextResource';
import {
  ResourceStartsWithResource,
  ResourceStartsWithResourceLabel,
} from '../entities/relationships/ResourceStartsWithResource';
import { UserConsumedResource, UserConsumedResourceLabel } from '../entities/relationships/UserConsumedResource';
import { UserCreatedResource, UserCreatedResourceLabel } from '../entities/relationships/UserCreatedResource';
import { UserRatedResource, UserRatedResourceLabel } from '../entities/relationships/UserRatedResource';
import { UserVotedResource, UserVotedResourceLabel } from '../entities/relationships/UserVotedResource';
import { Resource, ResourceLabel, ResourceMediaType, ResourceType } from '../entities/Resource';
import { User, UserLabel } from '../entities/User';
import { neo4jDriver, neo4jQb } from '../infra/neo4j';
import {
  attachUniqueNodes,
  createRelatedNode,
  deleteOne,
  deleteRelatedNode,
  detachUniqueNodes,
  findOne,
  getFilterString,
  getOptionalRelatedNode,
  getRelatedNode,
  getRelatedNodes,
  updateOne,
} from './util/abstract_graph_repo';
import { PaginationOptions } from './util/pagination';

export const searchResources = async (
  query: string,
  options: { pagination?: PaginationOptions }
): Promise<Resource[]> => {
  const pagination: Required<PaginationOptions> = {
    limit: 20,
    offset: 0,
    ...options.pagination,
  };
  const q = new Query(neo4jQb);
  q.match([node('r', ResourceLabel)]);
  q.raw(
    `WHERE (toLower(r.name) CONTAINS toLower($query) OR toLower(r.description) CONTAINS toLower($query) OR toLower(r.url) CONTAINS toLower($query) OR toLower(r.type) CONTAINS toLower($query))`,
    { query }
  );
  q.return('r')
    .skip(pagination.offset)
    .limit(pagination.limit);

  const results = await q.run();
  return results.map(item => item.r.properties);
};
interface CreateResourceData {
  name: string;
  type: ResourceType;
  mediaType: ResourceMediaType;
  url: string;
  description?: string;
}

interface UpdateResourceData {
  name?: string;
  type?: ResourceType;
  mediaType?: ResourceMediaType;
  url?: string;
  description?: string;
  durationMs?: number | null;
}

export const createResource = (user: { _id: string }, data: CreateResourceData): Promise<Resource> =>
  createRelatedNode({
    originNode: { label: UserLabel, filter: user },
    relationship: { label: 'CREATED', props: { createdAt: Date.now() } },
    newNode: { label: ResourceLabel, props: { ...data, _id: shortid.generate() } },
  });

export const updateResource = updateOne<Resource, { _id: string }, UpdateResourceData>({ label: ResourceLabel });

export const deleteResource = deleteOne<Resource, { _id: string }>({ label: ResourceLabel });

export const deleteResourceCreatedBy = (
  creatorFilter: { _id: string } | { key: string },
  resourceId: string
): Promise<{ deletedCount: number }> =>
  deleteRelatedNode<User, UserCreatedResource, Resource>({
    originNode: {
      label: UserLabel,
      filter: creatorFilter,
    },
    relationship: {
      label: UserCreatedResourceLabel,
      filter: {},
    },
    destinationNode: {
      label: ResourceLabel,
      filter: { _id: resourceId },
    },
  });

export const attachResourceToDomain = (resourceId: string, domainId: string) =>
  attachUniqueNodes<Resource, ResourceBelongsToDomain, Domain>({
    originNode: { label: ResourceLabel, filter: { _id: resourceId } },
    relationship: { label: ResourceBelongsToDomainLabel },
    destinationNode: { label: DomainLabel, filter: { _id: domainId } },
  }).then(({ originNode, destinationNode }) => ({ domain: destinationNode, resource: originNode }));

export const detachResourceFromDomain = (resourceId: string, domainId: string) =>
  detachUniqueNodes<Resource, ResourceBelongsToDomain, Domain>({
    originNode: {
      label: ResourceLabel,
      filter: { _id: resourceId },
    },
    relationship: {
      label: ResourceBelongsToDomainLabel,
      filter: {},
    },
    destinationNode: {
      label: DomainLabel,
      filter: { _id: domainId },
    },
  }).then(({ originNode, destinationNode }) => ({ domain: destinationNode, resource: originNode }));

export const findResource = findOne<Resource, { _id: string }>({ label: ResourceLabel });

// TODO use attachUniqueNodes
export const attachResourceCoversConcepts = async (
  resourceId: string,
  conceptIds: string[],
  props: { userId: string }
): Promise<Resource | null> => {
  const originNode = { label: ResourceLabel, filter: { _id: resourceId } };
  const relationship = { label: ResourceCoversConceptLabel, props };
  const destinationNode = { label: ConceptLabel, filter: {} };

  const session = neo4jDriver.session();

  const { records } = await session.run(
    `MATCH (originNode:${originNode.label} ${getFilterString(
      originNode.filter,
      'originNodeFilter'
    )}) MATCH (destinationNode:${destinationNode.label} ${getFilterString(
      destinationNode.filter,
      'destinationNodeFilter'
    )}) WHERE destinationNode._id IN $conceptIds MERGE (originNode)-[relationship:${
      relationship.label
    }]->(destinationNode) ON CREATE SET relationship = $relationshipProps RETURN properties(relationship) as relationship, properties(originNode) as originNode`,
    {
      originNodeFilter: originNode.filter,
      destinationNodeFilter: destinationNode.filter,
      relationshipProps: relationship.props,
      conceptIds,
    }
  );

  session.close();

  const record = records.pop();

  if (!record) throw new Error();

  return record.get('originNode');
};

export const detachResourceCoversConcepts = async (
  resourceId: string,
  conceptIds: string[]
): Promise<Resource | null> => {
  const originNode = { label: ResourceLabel, filter: { _id: resourceId } };
  const relationship = { label: ResourceCoversConceptLabel, props: {} };
  const destinationNode = { label: ConceptLabel, filter: {} };

  const session = neo4jDriver.session();

  const { records } = await session.run(
    `MATCH (originNode:${originNode.label} ${getFilterString(
      originNode.filter,
      'originNodeFilter'
    )}) MATCH (destinationNode:${destinationNode.label} ${getFilterString(
      destinationNode.filter,
      'destinationNodeFilter'
    )}) WHERE destinationNode._id IN $conceptIds MATCH (originNode)-[relationship:${
      relationship.label
    }]->(destinationNode) DELETE relationship RETURN properties(originNode) as originNode`,
    {
      originNodeFilter: originNode.filter,
      destinationNodeFilter: destinationNode.filter,
      conceptIds,
    }
  );

  session.close();

  const record = records.pop();

  if (!record) throw new Error();

  return record.get('originNode');
};

export const getResourceCoveredConcepts = (_id: string): Promise<Concept[]> =>
  getRelatedNodes<Resource, ResourceCoversConcept, Concept>({
    originNode: {
      label: ResourceLabel,
      filter: { _id },
    },
    relationship: {
      label: ResourceCoversConceptLabel,
    },
    destinationNode: {
      label: ConceptLabel,
    },
  })
    .then(prop('items'))
    .then(map(prop('destinationNode')));

export const getResourceCoveredConceptsByDomain = async (
  resourceId: string
): Promise<{ domain: Domain; coveredConcepts: Concept[] }[]> => {
  const q = new Query(neo4jQb);
  q.match([
    node('resource', ResourceLabel, { _id: resourceId }),
    relation('out', '', ResourceBelongsToDomainLabel),
    node('domain', DomainLabel),
  ]);
  q.optionalMatch([
    node('resource'),
    relation('out', '', ResourceCoversConceptLabel),
    node('concept', ConceptLabel),
    relation('out', '', ConceptBelongsToDomainLabel),
    node('domain', DomainLabel),
  ]);
  q.raw('WITH DISTINCT domain, collect(concept) as concepts RETURN *');

  const results = await q.run();
  return results.map(r => ({
    domain: r.domain.properties,
    coveredConcepts: r.concepts.map(c => c.properties),
  }));
};

export const getResourceDomains = (_id: string) =>
  getRelatedNodes<Resource, ResourceBelongsToDomain, Domain>({
    originNode: {
      label: ResourceLabel,
      filter: { _id },
    },
    relationship: {
      label: ResourceBelongsToDomainLabel,
    },
    destinationNode: {
      label: DomainLabel,
    },
  })
    .then(prop('items'))
    .then(map(prop('destinationNode')));

export const getUserConsumedResource = async (
  userId: string,
  resourceId: string
): Promise<UserConsumedResource | null> => {
  const { items } = await getRelatedNodes<User, UserConsumedResource, Resource>({
    originNode: {
      label: UserLabel,
      filter: { _id: userId },
    },
    relationship: {
      label: UserConsumedResourceLabel,
    },
    destinationNode: {
      label: ResourceLabel,
      filter: { _id: resourceId },
    },
  });
  const [result] = items;
  if (!result) return null;
  return result.relationship;
};

export const voteResource = async (userId: string, resourceId: string, value: number): Promise<Resource> =>
  attachUniqueNodes<User, UserVotedResource, Resource>({
    originNode: {
      label: UserLabel,
      filter: { _id: userId },
    },
    relationship: {
      label: UserVotedResourceLabel,
      onCreateProps: {
        value,
      },
      onMergeProps: {
        value,
      },
    },
    destinationNode: {
      label: ResourceLabel,
      filter: {
        _id: resourceId,
      },
    },
  }).then(({ destinationNode }) => {
    return destinationNode;
  });

export const getResourceUpvoteCount = async (resourceId: string): Promise<number> => {
  const session = neo4jDriver.session();

  const { records } = await session.run(
    `MATCH (resource:${ResourceLabel})<-[v:${UserVotedResourceLabel}]-(:User) WHERE resource._id = $resourceId 
    WITH sum(v.value) AS upvoteCount RETURN upvoteCount`,
    {
      resourceId,
    }
  );

  session.close();

  const record = records.pop();

  if (!record) throw new Error();
  return Number(record.get('upvoteCount').toString());
};

export const rateResource = async (userId: string, resourceId: string, value: number): Promise<Resource> =>
  attachUniqueNodes<User, UserRatedResource, Resource>({
    originNode: {
      label: UserLabel,
      filter: { _id: userId },
    },
    relationship: {
      label: UserRatedResourceLabel,
      onCreateProps: {
        value,
      },
      onMergeProps: {
        value,
      },
    },
    destinationNode: {
      label: ResourceLabel,
      filter: {
        _id: resourceId,
      },
    },
  }).then(({ destinationNode }) => {
    return destinationNode;
  });

export const getResourceRating = async (resourceId: string): Promise<number | null> => {
  const session = neo4jDriver.session();

  const { records } = await session.run(
    `MATCH (resource:${ResourceLabel})<-[v:${UserRatedResourceLabel}]-(:User) WHERE resource._id = $resourceId 
    WITH avg(v.value) AS rating RETURN rating`,
    {
      resourceId,
    }
  );

  session.close();

  const record = records.pop();

  if (!record) throw new Error();
  return record.get('rating') ? Number(record.get('rating').toString()) : null;
};

export const getResourceCreator = (resourceFilter: { _id: string }) =>
  getRelatedNode<User>({
    originNode: {
      label: ResourceLabel,
      filter: resourceFilter,
    },
    relationship: {
      label: UserCreatedResourceLabel,
      filter: {},
    },
    destinationNode: {
      label: UserLabel,
      filter: {},
    },
  });

export const getResourceSubResources = (parentResourceId: string) =>
  getRelatedNodes<Resource, ResourceBelongsToResource, Resource>({
    originNode: {
      label: ResourceLabel,
      filter: { _id: parentResourceId },
    },
    relationship: {
      label: ResourceBelongsToResourceLabel,
      direction: 'IN',
    },
    destinationNode: {
      label: ResourceLabel,
    },
  })
    .then(prop('items'))
    .then(map(prop('destinationNode')));

export const getResourceSubResourceSeries = async (parentResourceId: string) => {
  const q = new Query(neo4jQb);
  q.match([
    node('parent', ResourceLabel, { _id: parentResourceId }),
    relation('out', '', ResourceStartsWithResourceLabel),
    node('i', ResourceLabel),
  ]);
  q.optionalMatch([
    node('i'),
    relation('out', '', ResourceHasNextResourceLabel, undefined, [1, 100]),
    node('r', ResourceLabel),
  ]);
  q.raw(`WITH DISTINCT i, collect(r) as c UNWIND ([i] + c) as resourceSeries RETURN resourceSeries`);
  const results = await q.run();
  return results.map(r => r.resourceSeries.properties);
};

export const getResourceParentResources = (subResourceId: string): Promise<Resource[]> =>
  getRelatedNodes<Resource, ResourceBelongsToResource, Resource>({
    originNode: {
      label: ResourceLabel,
      filter: { _id: subResourceId },
    },
    relationship: {
      label: ResourceBelongsToResourceLabel,
      filter: {},
      direction: 'OUT',
    },
    destinationNode: {
      label: ResourceLabel,
      filter: {},
    },
  })
    .then(prop('items'))
    .then(map(prop('destinationNode')));

export const getResourceSeriesParentResource = async (subResourceId: string): Promise<Resource | null> => {
  const q = new Query(neo4jQb);
  q.match([
    node('s', ResourceLabel, { _id: subResourceId }),
    relation('in', '', ResourceHasNextResourceLabel, undefined, [0, 100]),
    node('r', ResourceLabel),
    relation('in', '', ResourceStartsWithResourceLabel),
    node('i', ResourceLabel),
  ]);

  q.return('i');

  const results = await q.run();
  return results.map(r => r.i.properties)[0] || null;
};

export const getResourceNextResource = (resourceId: string) =>
  getOptionalRelatedNode<Resource, ResourceHasNextResource, Resource>({
    originNode: {
      label: ResourceLabel,
      filter: { _id: resourceId },
    },
    relationship: {
      label: ResourceHasNextResourceLabel,
      filter: {},
      direction: 'OUT',
    },
    destinationNode: {
      label: ResourceLabel,
      filter: {},
    },
  });

export const getResourcePreviousResource = (resourceId: string) =>
  getOptionalRelatedNode<Resource, ResourceHasNextResource, Resource>({
    originNode: {
      label: ResourceLabel,
      filter: { _id: resourceId },
    },
    relationship: {
      label: ResourceHasNextResourceLabel,
      filter: {},
      direction: 'IN',
    },
    destinationNode: {
      label: ResourceLabel,
      filter: {},
    },
  });

export const attachSubResourceToResource = (parentResourceId: string, subResourceId: string) =>
  attachUniqueNodes<Resource, ResourceBelongsToResource, Resource>({
    originNode: { label: ResourceLabel, filter: { _id: subResourceId } },
    relationship: { label: ResourceBelongsToResourceLabel },
    destinationNode: { label: ResourceLabel, filter: { _id: parentResourceId } },
  }).then(({ originNode, destinationNode }) => ({ parentResource: destinationNode, subResource: originNode }));

export const createSubResourceSeries = (parentResouceId: string, subResourceId: string) =>
  attachUniqueNodes<Resource, ResourceStartsWithResource, Resource>({
    originNode: { label: ResourceLabel, filter: { _id: parentResouceId } },
    relationship: { label: ResourceStartsWithResourceLabel },
    destinationNode: { label: ResourceLabel, filter: { _id: subResourceId } },
  }).then(({ originNode, destinationNode }) => ({ seriesParentResource: originNode, subResource: destinationNode }));

export const addSubResourceToSeries = (parentResourceId: string, previousResourceId: string, subResourceId: string) =>
  attachUniqueNodes<Resource, ResourceHasNextResource, Resource>({
    originNode: { label: ResourceLabel, filter: { _id: previousResourceId } },
    relationship: { label: ResourceHasNextResourceLabel, onCreateProps: { parentResourceId } },
    destinationNode: { label: ResourceLabel, filter: { _id: subResourceId } },
  }).then(({ originNode, destinationNode }) => ({
    previousResource: originNode,
    subResource: destinationNode,
  }));
