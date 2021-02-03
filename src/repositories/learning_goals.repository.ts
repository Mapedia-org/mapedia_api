import { omit } from 'lodash';
import * as shortid from 'shortid';
import { generateUrlKey } from '../api/util/urlKey';
import { Domain, DomainLabel } from '../entities/Domain';
import { LearningGoal, LearningGoalLabel, LearningGoalType } from '../entities/LearningGoal';
import {
  LearningGoalBelongsToDomain,
  LearningGoalBelongsToDomainLabel,
} from '../entities/relationships/LearningGoalBelongsToDomain';
import {
  LearningGoalRequiresSubGoal,
  LearningGoalRequiresSubGoalLabel,
} from '../entities/relationships/LearningGoalRequiresSubGoal';
import { DEFAULT_INDEX_VALUE } from '../entities/relationships/TopicBelongsToDomain';
import {
  UserCreatedLearningGoal,
  UserCreatedLearningGoalLabel,
} from '../entities/relationships/UserCreatedLearningGoal';
import {
  UserStartedLearningGoal,
  UserStartedLearningGoalLabel,
} from '../entities/relationships/UserStartedLearningGoal';
import { SubGoal } from '../entities/SubGoal';
import { TopicLabel, TopicType } from '../entities/Topic';
import { User, UserLabel } from '../entities/User';
import { neo4jDriver } from '../infra/neo4j';
import {
  attachUniqueNodes,
  countRelatedNodes,
  createRelatedNode,
  deleteOne,
  detachUniqueNodes,
  findOne,
  getOptionalRelatedNode,
  getRelatedNode,
  getRelatedNodes,
  updateOne,
} from './util/abstract_graph_repo';
import { PaginationOptions } from './util/pagination';

interface CreateLearningGoalData {
  name: string;
  type: LearningGoalType;
  key?: string;
  description?: string;
  public?: boolean;
}

export const createLearningGoal = (
  userFilter: { _id: string } | { key: string },
  data: CreateLearningGoalData
): Promise<LearningGoal> =>
  createRelatedNode<User, UserCreatedLearningGoal, LearningGoal>({
    originNode: { label: UserLabel, filter: userFilter },
    relationship: { label: UserCreatedLearningGoalLabel, props: { createdAt: Date.now() } },
    newNode: {
      labels: [LearningGoalLabel, TopicLabel],
      props: {
        ...omit(data, 'public'),
        _id: shortid.generate(),
        key: data.key ? generateUrlKey(data.key) : generateLearningGoalKey(data.name),
        topicType: TopicType.LearningGoal,
        publishedAt: data.public ? Date.now() : undefined,
      },
    },
  });

interface UpdateLearningGoalPayload {
  name?: string;
  key?: string;
  type?: LearningGoalType;
  description?: string;
  public?: boolean;
}

interface UpdateLearningGoalData {
  name?: string;
  key?: string;
  type?: LearningGoalType;
  description?: string;
  publishedAt?: number;
}

export const updateLearningGoal = (filter: { _id: string } | { key: string }, data: UpdateLearningGoalPayload) =>
  updateOne<LearningGoal, { _id: string } | { key: string }, UpdateLearningGoalData>({
    label: LearningGoalLabel,
  })(filter, { ...omit(data, 'public'), publishedAt: data.public ? Date.now() : undefined });

export const findLearningGoal = findOne<LearningGoal, { key: string } | { _id: string }>({ label: LearningGoalLabel });

export const searchLearningGoals = async (
  { query }: { query?: string },
  pagination: { offset?: number; limit?: number }
): Promise<LearningGoal[]> => {
  const session = neo4jDriver.session();
  const { records } = await session.run(
    `MATCH (node:${LearningGoalLabel}) ${
      query
        ? 'WHERE toLower(node.name) CONTAINS toLower($query) OR toLower(node.description) CONTAINS toLower($query)'
        : ''
    }RETURN properties(node) AS node${pagination && pagination.offset ? ' SKIP ' + pagination.offset : ''}${
      pagination && pagination.limit ? ' LIMIT ' + pagination.limit : ''
    }`,
    {
      query,
    }
  );
  session.close();
  return records.map(r => r.get('node'));
};
export const findLearningGoalCreatedBy = (
  userId: string,
  learningGoalFilter: { _id: string } | { key: string }
): Promise<LearningGoal | null> =>
  getOptionalRelatedNode<User, UserCreatedLearningGoal, LearningGoal>({
    originNode: { label: UserLabel, filter: { _id: userId } },
    relationship: { label: UserCreatedLearningGoalLabel, direction: 'OUT' },
    destinationNode: { label: LearningGoalLabel, filter: learningGoalFilter },
  }).then(result => (result ? result.destinationNode : null));

export const deleteLearningGoal = deleteOne<LearningGoal, { _id: string } | { key: string }>({
  label: LearningGoalLabel,
});

export const attachLearningGoalToDomain = (
  learningGoalId: string,
  domainId: string,
  { contextualKey, contextualName }: { contextualKey: string; contextualName: string }
): Promise<{ domain: Domain; learningGoal: LearningGoal }> =>
  attachUniqueNodes<LearningGoal, LearningGoalBelongsToDomain, Domain>({
    originNode: { label: LearningGoalLabel, filter: { _id: learningGoalId } },
    relationship: {
      label: LearningGoalBelongsToDomainLabel,
      onCreateProps: { index: DEFAULT_INDEX_VALUE, contextualKey, contextualName },
    },
    destinationNode: { label: DomainLabel, filter: { _id: domainId } },
  }).then(({ originNode, destinationNode }) => ({ learningGoal: originNode, domain: destinationNode }));

export const detachLearningGoalFromDomain = (
  learningGoalId: string,
  domainId: string
): Promise<{ domain: Domain; learningGoal: LearningGoal }> =>
  detachUniqueNodes<LearningGoal, LearningGoalBelongsToDomain, Domain>({
    originNode: { label: LearningGoalLabel, filter: { _id: learningGoalId } },
    relationship: { label: LearningGoalBelongsToDomainLabel, filter: {} },
    destinationNode: { label: DomainLabel, filter: { _id: domainId } },
  }).then(({ originNode, destinationNode }) => ({ learningGoal: originNode, domain: destinationNode }));

export const getLearningGoalDomain = (
  learningGoalId: string
): Promise<{ domain: Domain; relationship: LearningGoalBelongsToDomain; learningGoal: LearningGoal } | null> =>
  getOptionalRelatedNode<LearningGoal, LearningGoalBelongsToDomain, Domain>({
    originNode: {
      label: LearningGoalLabel,
      filter: {
        _id: learningGoalId,
      },
    },
    relationship: {
      label: LearningGoalBelongsToDomainLabel,
      filter: {},
    },
    destinationNode: {
      label: DomainLabel,
      filter: {},
    },
  }).then(data =>
    data ? { domain: data.destinationNode, relationship: data.relationship, learningGoal: data.originNode } : null
  );

export const findDomainLearningGoalByKey = (
  domainKey: string,
  contextualLearningGoalKey: string
): Promise<{ learningGoal: LearningGoal; domain: Domain } | null> =>
  getOptionalRelatedNode<Domain, LearningGoalBelongsToDomain, LearningGoal>({
    originNode: {
      label: DomainLabel,
      filter: { key: domainKey },
    },
    relationship: {
      label: LearningGoalBelongsToDomainLabel,
      direction: 'IN',
      filter: { contextualKey: contextualLearningGoalKey },
    },
    destinationNode: {
      label: LearningGoalLabel,
      filter: {},
    },
  }).then(result => (result ? { learningGoal: result.destinationNode, domain: result.originNode } : null));

function generateLearningGoalKey(name: string) {
  return shortid.generate() + '_' + generateUrlKey(name);
}

export const attachLearningGoalRequiresSubGoal = async (
  learningGoalId: string,
  subGoalId: string,
  { strength }: { strength?: number }
): Promise<{ subGoal: SubGoal; learningGoal: LearningGoal }> =>
  attachUniqueNodes<LearningGoal, LearningGoalRequiresSubGoal, SubGoal>({
    originNode: { label: LearningGoalLabel, filter: { _id: learningGoalId } },
    relationship: {
      label: LearningGoalRequiresSubGoalLabel,
      onCreateProps: { strength: strength || 100 },
      onMergeProps: { strength },
    },
    destinationNode: { label: TopicLabel, filter: { _id: subGoalId } },
  }).then(({ originNode, destinationNode }) => ({ learningGoal: originNode, subGoal: destinationNode }));

export const detachLearningGoalRequiresSubGoal = async (
  learningGoalId: string,
  subGoalId: string
): Promise<{ subGoal: SubGoal; learningGoal: LearningGoal }> =>
  detachUniqueNodes<LearningGoal, LearningGoalRequiresSubGoal, SubGoal>({
    originNode: { label: LearningGoalLabel, filter: { _id: learningGoalId } },
    relationship: {
      label: LearningGoalRequiresSubGoalLabel,
      filter: {},
    },
    destinationNode: { label: TopicLabel, filter: { _id: subGoalId } },
  }).then(({ originNode, destinationNode }) => ({ learningGoal: originNode, subGoal: destinationNode }));

export const getLearningGoalRequiredSubGoals = (
  learningGoalId: string
): Promise<{
  learningGoal: LearningGoal;
  relationship: LearningGoalRequiresSubGoal;
  subGoal: SubGoal;
}[]> =>
  getRelatedNodes<LearningGoal, LearningGoalRequiresSubGoal, SubGoal>({
    originNode: {
      label: LearningGoalLabel,
      filter: { _id: learningGoalId },
    },
    relationship: {
      label: LearningGoalRequiresSubGoalLabel,
      direction: 'OUT',
    },
    destinationNode: {
      label: TopicLabel, // TODO: that's not clean, should be explicitely concept or learning goal
    },
  }).then(items =>
    items.map(({ destinationNode, relationship, originNode }) => ({
      learningGoal: originNode,
      relationship,
      subGoal: destinationNode,
    }))
  );

export const getLearningGoalRequiredInGoals = (
  learningGoalId: string
): Promise<{
  learningGoal: LearningGoal;
  relationship: LearningGoalRequiresSubGoal;
  parentGoal: LearningGoal;
}[]> =>
  getRelatedNodes<LearningGoal, LearningGoalRequiresSubGoal, LearningGoal>({
    originNode: {
      label: LearningGoalLabel,
      filter: { _id: learningGoalId },
    },
    relationship: {
      label: LearningGoalRequiresSubGoalLabel,
      direction: 'IN',
    },
    destinationNode: {
      label: LearningGoalLabel,
    },
  }).then(items =>
    items.map(({ destinationNode, relationship, originNode }) => ({
      learningGoal: originNode,
      relationship,
      parentGoal: destinationNode,
    }))
  );

export const getLearningGoalCreator = (learningGoalId: string): Promise<User> =>
  getRelatedNode<User>({
    originNode: {
      label: LearningGoalLabel,
      filter: { _id: learningGoalId },
    },
    relationship: {
      label: UserCreatedLearningGoalLabel,
      filter: {},
      direction: 'IN',
    },
    destinationNode: {
      label: UserLabel,
      filter: {},
    },
  });

export const attachUserStartedLearningGoal = (
  userId: string,
  learningGoalId: string,
  creationData?: UserStartedLearningGoal
): Promise<{ user: User; relationship: UserStartedLearningGoal; learningGoal: LearningGoal }> =>
  attachUniqueNodes<User, UserStartedLearningGoal, LearningGoal>({
    originNode: { label: UserLabel, filter: { _id: userId } },
    relationship: { label: UserStartedLearningGoalLabel, onCreateProps: creationData },
    destinationNode: { label: LearningGoalLabel, filter: { _id: learningGoalId } },
  }).then(({ originNode, relationship, destinationNode }) => ({
    user: originNode,
    relationship,
    learningGoal: destinationNode,
  }));

export const getUserStartedLearningGoal = (
  userId: string,
  learningGoalId: string
): Promise<UserStartedLearningGoal | null> =>
  getOptionalRelatedNode<User, UserStartedLearningGoal, LearningGoal>({
    originNode: {
      label: UserLabel,
      filter: { _id: userId },
    },
    relationship: {
      label: UserStartedLearningGoalLabel,
      direction: 'OUT',
    },
    destinationNode: {
      label: LearningGoalLabel,
      filter: { _id: learningGoalId },
    },
  }).then(result => (result ? result.relationship : null));

export const getLearningGoalStartedBy = (
  learningGoalId: string,
  { pagination }: { pagination?: PaginationOptions }
): Promise<{ user: User; relationship: UserStartedLearningGoal }[]> =>
  getRelatedNodes<LearningGoal, UserStartedLearningGoal, User>({
    originNode: {
      label: LearningGoalLabel,
      filter: { _id: learningGoalId },
    },
    relationship: {
      label: UserStartedLearningGoalLabel,
      direction: 'IN',
    },
    destinationNode: {
      label: UserLabel,
    },
    pagination,
  }).then(items =>
    items.map(({ relationship, destinationNode }) => ({
      relationship,
      user: destinationNode,
    }))
  );

export const countLearningGoalStartedBy = (learningGoalId: string): Promise<number> =>
  countRelatedNodes<LearningGoal, UserStartedLearningGoal, User>({
    originNode: {
      label: LearningGoalLabel,
      filter: { _id: learningGoalId },
    },
    relationship: {
      label: UserStartedLearningGoalLabel,
      direction: 'IN',
    },
    destinationNode: {
      label: UserLabel,
    },
  });
