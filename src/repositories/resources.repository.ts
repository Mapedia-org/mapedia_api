import { map, prop } from 'ramda';
import * as shortid from 'shortid';
import { Concept, ConceptLabel } from '../entities/Concept';
import { Domain, DomainLabel } from '../entities/Domain';
import {
  ResourceBelongsToDomain,
  ResourceBelongsToDomainLabel,
} from '../entities/relationships/ResourceBelongsToDomain';
import { ResourceCoversConcept, ResourceCoversConceptLabel } from '../entities/relationships/ResourceCoversConcept';
import { UserConsumedResource, UserConsumedResourceLabel } from '../entities/relationships/UserConsumedResource';
import { UserCreatedResource, UserCreatedResourceLabel } from '../entities/relationships/UserCreatedResource';
import { UserRatedResource, UserRatedResourceLabel } from '../entities/relationships/UserRatedResource';
import { UserVotedResource, UserVotedResourceLabel } from '../entities/relationships/UserVotedResource';
import { Resource, ResourceLabel, ResourceMediaType, ResourceType } from '../entities/Resource';
import { User, UserLabel } from '../entities/User';
import { neo4jDriver } from '../infra/neo4j';
import {
  attachNodes,
  attachUniqueNodes,
  createRelatedNode,
  deleteOne,
  deleteRelatedNode,
  findOne,
  getFilterString,
  getRelatedNode,
  getRelatedNodes,
  updateOne,
} from './util/abstract_graph_repo';

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
  attachNodes<Resource, ResourceBelongsToDomain, Domain>({
    originNode: { label: ResourceLabel, filter: { _id: resourceId } },
    relationship: { label: ResourceBelongsToDomainLabel },
    destinationNode: { label: DomainLabel, filter: { _id: domainId } },
  });

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
