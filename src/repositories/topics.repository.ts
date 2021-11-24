import { node, Query, relation } from 'cypher-query-builder';
import shortid from 'shortid';
import { APITopicLearningMaterialsSortingType } from '../api/schema/types';
import { generateUrlKey } from '../api/util/urlKey';
import { LearningMaterial, LearningMaterialLabel, LearningMaterialType } from '../entities/LearningMaterial';
import { ResourceLabel, ResourceType } from '../entities/Resource'
import { LearningGoalShowedInTopic, LearningGoalShowedInTopicLabel } from '../entities/relationships/LearningGoalShowedInTopic';
import { LearningMaterialShowedInTopicLabel } from '../entities/relationships/LearningMaterialShowedInTopic';
import { TopicHasPrerequisiteTopic, TopicHasPrerequisiteTopicLabel, TOPIC_HAS_PREREQUISITE_TOPIC_STRENGTH_DEFAULT_VALUE } from '../entities/relationships/TopicHasPrerequisiteTopic';
import { TopicIsSubTopicOfTopic, TopicIsSubTopicOfTopicLabel } from '../entities/relationships/TopicIsSubTopicOfTopic';
import { UserCreatedTopic, UserCreatedTopicLabel } from '../entities/relationships/UserCreatedTopic';
import { Topic, TopicLabel } from '../entities/Topic';
import { User, UserLabel } from '../entities/User';
import { neo4jDriver, neo4jQb } from '../infra/neo4j';
import { attachUniqueNodes, countRelatedNodes, createRelatedNode, deleteOne, detachUniqueNodes, findOne, getOptionalRelatedNode, getRelatedNode, getRelatedNodes, updateOne } from './util/abstract_graph_repo';
import { SortingDirection } from './util/sorting';
import { LearningPathLabel } from '../entities/LearningPath';
import { LearningMaterialCoversTopicLabel } from '../entities/relationships/LearningMaterialCoversTopic';
import { recommendationEngineConfig } from '../config';
import { UserRatedLearningMaterialLabel } from '../entities/relationships/UserRatedLearningMaterial';

interface CreateTopicData {
  name: string;
  key?: string;
  description?: string;
}

export const createTopic = (user: { _id: string } | { key: string }, data: CreateTopicData): Promise<Topic> =>
  createRelatedNode<User, UserCreatedTopic, Topic>({
    originNode: { label: UserLabel, filter: user },
    relationship: { label: UserCreatedTopicLabel, props: { createdAt: Date.now() } },
    newNode: {
      labels: [TopicLabel],
      props: {
        ...data,
        key: generateUrlKey(data.key || data.name), // a bit ugly
        _id: shortid.generate(),
        updatedAt: Date.now(),
        createdAt: Date.now()
      },
    },
  });


interface UpdateTopicData {
  key?: string;
  name?: string;
  description?: string;
}

type TopicFilter =  { _id: string } | { key: string }

export const updateTopic = (topicFilter: TopicFilter, data: UpdateTopicData) => updateOne<Topic,TopicFilter, UpdateTopicData & {updatedAt: number}>({
    label: TopicLabel,
  })(topicFilter, {
    ...data,
    updatedAt: Date.now()
  });
  
export const deleteTopic = deleteOne<Topic, { _id: string } | { key: string }>({ label: TopicLabel });

const findTopic = findOne<Topic, { _id: string } | {key: string}>({ label: TopicLabel })

export const getTopicById = (topicId: string) => findTopic({ _id: topicId });

  export const getTopicByKey = (topicKey: string) => findTopic({ key: topicKey });

export const searchTopics = async (
  query: string,
  pagination: { offset?: number; limit?: number }
): Promise<Topic[]> => {
  const session = neo4jDriver.session();
  const { records } = await session.run(
    `MATCH (node:${TopicLabel}) WHERE (NOT node:LearningGoal OR node.hidden = false) ${
      query
        ? 'AND (toLower(node.name) CONTAINS toLower($query) OR toLower(node.description) CONTAINS toLower($query))'
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

// ========= Learning materials =======
interface TopicLearningMaterialsFilter {
  resourceTypeIn?: ResourceType[];
  completedByUser: Boolean;
  learningMaterialTypeIn?: LearningMaterialType[];
}
export const getTopicLearningMaterials = async (
  topicId: string,
  userId: string | undefined,
  {
    query,
    filter,
    sortingType,
  }: { query?: string; filter: TopicLearningMaterialsFilter; sortingType: APITopicLearningMaterialsSortingType }
): Promise<LearningMaterial[]> => {
  const lmLabel =
    !!filter.learningMaterialTypeIn && filter.learningMaterialTypeIn.length === 1
      ? filter.learningMaterialTypeIn[0]
      : LearningMaterialLabel;

  const q = new Query(neo4jQb);
  if (userId) q.matchNode('u', 'User', { _id: userId });

  q.match([node('d', TopicLabel, { _id: topicId }), relation('in', '', LearningGoalShowedInTopicLabel), node('lm', lmLabel)]);

  q.raw(`WHERE (NOT lm:${LearningPathLabel} OR lm.public = true)`);

  if (filter.resourceTypeIn) {
    q.raw(`AND (NOT lm:${ResourceLabel} OR lm.type IN $resourceTypeIn)`, {
      resourceTypeIn: filter.resourceTypeIn,
    });
  }

  if (query) {
    q.raw(
      ` AND (toLower(lm.name) CONTAINS toLower($query) OR toLower(lm.description) CONTAINS toLower($query) OR toLower(lm.url) CONTAINS toLower($query) OR toLower(lm.type) CONTAINS toLower($query))`,
      { query }
    );
  }

  if (userId) {
    if (filter.completedByUser) {
      q.raw(
        ` AND ((NOT lm:${ResourceLabel} OR EXISTS { (u)-[consumed_r:CONSUMED]->(lm) WHERE exists(consumed_r.consumedAt) }) 
        AND (NOT lm:${LearningPathLabel} OR EXISTS { (u)-[started_r:STARTED]->(lm) WHERE exists(started_r.completedAt) }))` // TODO add completion for lps
      );
    } else {
      q.raw(
        ` AND (NOT lm:${ResourceLabel} OR (NOT (u)-[:CONSUMED]->(lm) OR EXISTS { (u)-[consumed_r:CONSUMED]->(lm)  where consumed_r.consumedAt IS NULL }))
        AND (NOT lm:${LearningPathLabel} OR (NOT (u)-[:STARTED]->(lm) OR EXISTS { (u)-[started_r:STARTED]->(lm)  where started_r.completedAt IS NULL }))`
      );
    }
  }

  if (sortingType === APITopicLearningMaterialsSortingType.Recommended) {
    q.optionalMatch([node('lm'), relation('out', '', LearningMaterialCoversTopicLabel), node('cc', TopicLabel)]);
    q.optionalMatch([node('cc'), relation('out', 'dpc', TopicHasPrerequisiteTopicLabel, [0, 5]), node('mpc', TopicLabel)]);
    q.raw(`WHERE NOT (lm)-[:${LearningMaterialCoversTopicLabel}]->(mpc)`);
    if (userId) q.raw('AND NOT (u)-[:KNOWS]->(mpc)');
    if (userId) q.optionalMatch([node('cc'), relation('in', 'rkc', 'KNOWS'), node('u')]);
    if (userId)
      q.with([
        'DISTINCT lm',
        'CASE WHEN lm:LearningPath THEN 1 ELSE 0 END as isLearningPath',
        'u',
        'count(cc) as ccc',
        'count(distinct mpc) as cmpc',
        '1 - toFloat(count(rkc)+0.0001)/(count(cc)+0.0001) as usefulness',
      ]);
    else
      q.with([
        'DISTINCT lm',
        'CASE WHEN lm:LearningPath THEN 1 ELSE 0 END as isLearningPath',
        'count(cc) as ccc',
        'count(distinct mpc) as cmpc',
      ]);

    if (userId && filter.completedByUser === false) {
      // can avoid doing that for lps
      // undefined case: cprnc = 0 and npr =0
      q.raw(`CALL {
        WITH lm,u
          MATCH (nextToConsume:${lmLabel})-[rel:HAS_NEXT|STARTS_WITH*0..100]->(lm)
          WHERE (NOT (u)-[:CONSUMED]->(nextToConsume) OR EXISTS { (u)-[consumed_r:CONSUMED]->(nextToConsume)  where consumed_r.consumedAt IS NULL })
          AND ((NOT (nextToConsume)<-[:HAS_NEXT|:STARTS_WITH]-(:Resource)) OR EXISTS { (u)-[consumed_r:CONSUMED]->(previous:Resource)-[:HAS_NEXT|:STARTS_WITH]->(nextToConsume)  where consumed_r.consumedAt IS NOT NULL })
          WITH collect(nextToConsume) as nextToConsume, rel, count(rel) as countRel, (1-sign(size((lm)<-[:HAS_NEXT]-(:Resource)))) as npr ORDER BY countRel DESC LIMIT 1
          return nextToConsume[0] as nextToConsumeInSeries, npr,  size([x in rel where type(x) = 'HAS_NEXT']) as cprnc
      }`);
      q.return([
        'lm',
        'isLearningPath',
        'cmpc',
        ' usefulness',
        `sign(ccc)*usefulness/(0.1+cmpc)  + (-1*cprnc) + (1 -sign(cprnc))*((1-npr)*0.5) + isLearningPath*${recommendationEngineConfig.learningMaterials.learningPathBonus} as score`,
      ]);
    } else {
      // when not logged in, find the first one of series, return cprnc for each of them in order to order them
      q.raw(`CALL {
        WITH lm
          MATCH (nextToConsume:${lmLabel})-[rel:HAS_NEXT|STARTS_WITH*0..100]->(lm)
          WHERE NOT (nextToConsume)<-[:HAS_NEXT|:STARTS_WITH]-(:Resource)
          WITH collect(nextToConsume) as nextToConsume, rel, count(rel) as countRel ORDER BY countRel DESC LIMIT 1
          return nextToConsume[0] as nextToConsumeInSeries, size([x in rel where type(x) = 'HAS_NEXT']) as cprnc
      }`);
      q.return([
        'lm',
        'cmpc',
        `sign(ccc)/(0.1+cmpc) -1*cprnc + isLearningPath*${recommendationEngineConfig.learningMaterials.learningPathBonus} as score`,
      ]);
    }
    q.orderBy('score', 'DESC');
  } else if (sortingType === APITopicLearningMaterialsSortingType.Rating) {
    q.optionalMatch([
      node('lm'),
      relation('in', 'ratedLearningMaterial', UserRatedLearningMaterialLabel),
      node('', 'User'),
    ]);
    q.with(['DISTINCT lm', 'avg(ratedLearningMaterial.value) AS rating']);
    q.return(['lm', 'rating']);
    q.raw(' ORDER BY rating IS NOT NULL DESC, rating DESC');
  } else {
    q.match([node('lm'), relation('in', 'createdLearningMaterial', 'CREATED'), node('', 'User')]);
    q.return(['lm']);
    q.orderBy('createdLearningMaterial.createdAt', 'DESC');
  }

  const r = await q.run();
  const learningMaterials = r.map(i => i.lm.properties);
  return learningMaterials;
};

export const countLearningMaterialsShowedInTopic = (topicId: string): Promise<number> =>
  countRelatedNodes<Topic, LearningGoalShowedInTopic, LearningMaterial>({
    originNode: {
      label: TopicLabel,
      filter: { _id: topicId },
    },
    relationship: {
      label: LearningMaterialShowedInTopicLabel,
    },
    destinationNode: {
      label: LearningMaterialLabel,
    },
  });

  // TODO
  // export const getLearningGoalsShowedInTopic = (
  //   domainId: string
  // ): Promise<{ learningGoal: LearningGoal; relationship: LearningGoalBelongsToDomain; domain: Domain }[]> =>
  //   getRelatedNodes<Domain, LearningGoalBelongsToDomain, LearningGoal>({
  //     originNode: {
  //       label: DomainLabel,
  //       filter: { _id: domainId },
  //     },
  //     relationship: {
  //       label: LearningGoalBelongsToDomainLabel,
  //       direction: 'IN',
  //     },
  //     destinationNode: {
  //       label: LearningGoalLabel,
  //       filter: { hidden: false },
  //     },
  //   }).then(items =>
  //     items.map(({ destinationNode, relationship, originNode }) => ({
  //       learningGoal: destinationNode,
  //       relationship,
  //       domain: originNode,
  //     }))
  //   );
// ======== SUBTOPICS =========

// TODO include "part_of" topics
// TODO check if duplicates in results
export const searchSubTopics = async (
  rootTopicId: string,
  query: string,
  pagination: { offset?: number; limit?: number },
): Promise<Topic[]> => {
  const session = neo4jDriver.session();

  const { records } = await session.run(
    `MATCH (rootTopic:${TopicLabel}) WHERE rootTopic._id = $rootTopicId
    MATCH (rootTopic)<-[:${TopicIsSubTopicOfTopicLabel}*1..20]-(node:${TopicLabel})
    AND (toLower(node.name) CONTAINS toLower($query) OR toLower(node.description) CONTAINS toLower($query)) 
     RETURN properties(node) AS node${pagination && pagination.offset ? ' SKIP ' + pagination.offset : ''}${
      pagination && pagination.limit ? ' LIMIT ' + pagination.limit : ''
    }`,
    {
      query,
      rootTopicId,
    }
  );
  session.close();

  return records.map(r => r.get('node'));
};

export const getTopicSubTopicsTotalCount = async (_id: string): Promise<number> => {
  const q = new Query(neo4jQb);
  q.raw(
    `match (n:${TopicLabel} {_id: $topicId})<-[:${TopicIsSubTopicOfTopicLabel}*0..20]-(c:${TopicLabel})  return count(DISTINCT c) as size`,
    {
      topicId: _id,
    }
  );
  const r = await q.run();
  const [size] = r.map(i => i.size);
  return size;
};

export const getTopicSubTopics = (
  topicId: string,
  sortingOptions: { type: 'index'; direction: SortingDirection },
): Promise<{ parentTopic: Topic; relationship: TopicIsSubTopicOfTopic; subTopic: Topic }[]> =>
  getRelatedNodes<Topic, TopicIsSubTopicOfTopic, Topic>({
    originNode: {
      label: TopicLabel,
      filter: { _id: topicId },
    },
    relationship: {
      label: TopicIsSubTopicOfTopicLabel,
      direction: 'IN',
    },
    destinationNode: {
      label: TopicLabel,
      // filter: { hidden: false }, TODO
    },
    sorting: {
      entity: 'relationship',
      field: sortingOptions.type,
      direction: sortingOptions.direction,
    },
  }).then(items =>
    items.map(({ relationship, destinationNode, originNode }) => ({
      parentTopic: originNode,
      relationship,
      subTopic: destinationNode,
    }))
  );

export const getTopicParentTopic = (
  topicId: string,
): Promise<{ parentTopic: Topic; relationship: TopicIsSubTopicOfTopic; subTopic: Topic } | null> =>
  getOptionalRelatedNode<Topic, TopicIsSubTopicOfTopic, Topic>({
    originNode: {
      label: TopicLabel,
      filter: { _id: topicId },
    },
    relationship: {
      label: TopicIsSubTopicOfTopicLabel,
      direction: 'OUT',
    },
    destinationNode: {
      label: TopicLabel,
    },

  }).then(item =>
   item ? ({
      parentTopic: item.destinationNode,
      relationship: item.relationship,
      subTopic: item.originNode,
    }) : null
  );

export const attachTopicIsSubTopicOfTopic = (
  parentTopicId: string,
  subTopicId: string,
  { index, createdByUserId }: { index: number; createdByUserId?: string }
): Promise<{
  parentTopic: Topic;
  relationship: TopicIsSubTopicOfTopic;
  subTopic: Topic;
}> =>
  attachUniqueNodes<Topic, TopicIsSubTopicOfTopic, Topic>({
    originNode: { label: TopicLabel, filter: { _id: subTopicId } },
    relationship: {
      label: TopicIsSubTopicOfTopicLabel,
      onCreateProps: { index, createdAt: Date.now(), createdByUserId },
    },
    destinationNode: { label: TopicLabel, filter: { _id: parentTopicId } },
  }).then(({ originNode, relationship, destinationNode }) => {
    return {
      parentTopic: destinationNode,
      relationship,
      subTopic: originNode,
    };
  });

export const updateTopicIsSubTopicOfTopic = (
  parentTopicId: string,
  subTopicId: string,
  { index }: { index?: number }
): Promise<{
  parentTopic: Topic;
  relationship: TopicIsSubTopicOfTopic;
  subTopic: Topic;
}> =>
  attachUniqueNodes<Topic, TopicIsSubTopicOfTopic, Topic>({
    originNode: { label: TopicLabel, filter: { _id: subTopicId } },
    relationship: { label: TopicIsSubTopicOfTopicLabel, onMergeProps: { ...(!!index && { index }) } },
    destinationNode: { label: TopicLabel, filter: { _id: parentTopicId } },
  }).then(({ originNode, relationship, destinationNode }) => {
    return {
      parentTopic: destinationNode,
      relationship,
      subTopic: originNode,
    };
  });

export const detachTopicIsSubTopicOfTopic = (
  parentTopicId: string,
  subTopicId: string
): Promise<{ subTopic: Topic; parentTopic: Topic }> =>
  detachUniqueNodes<Topic, TopicIsSubTopicOfTopic, Topic>({
    originNode: {
      label: TopicLabel,
      filter: { _id: subTopicId },
    },
    relationship: {
      label: TopicIsSubTopicOfTopicLabel,
      filter: {},
    },
    destinationNode: {
      label: TopicLabel,
      filter: { _id: parentTopicId },
    },
  }).then(({ originNode, destinationNode }) => {
    return {
      subTopic: originNode,
      parentTopic: destinationNode,
    };
  });

// ====== Prerequisites ======
export const attachTopicHasPrerequisiteTopic = (
  topicId: string,
  prerequisiteTopicId: string,
  strength?: number
): Promise<{ prerequisiteTopic: Topic; relationship: TopicHasPrerequisiteTopic; topic: Topic }> =>
  attachUniqueNodes<Topic, TopicHasPrerequisiteTopic, Topic>({
    originNode: { label: TopicLabel, filter: { _id: topicId } },
    relationship: {
      label: TopicHasPrerequisiteTopicLabel,
      onCreateProps: { strength: strength || TOPIC_HAS_PREREQUISITE_TOPIC_STRENGTH_DEFAULT_VALUE },
      onMergeProps: { strength },
    },
    destinationNode: { label: TopicLabel, filter: { _id: prerequisiteTopicId } },
  }).then(({ originNode, relationship, destinationNode }) => {
    return {
      topic: originNode,
      relationship,
      prerequisiteTopic: destinationNode,
    };
  });

export const detachTopicHasPrerequisiteTopic = (
  topicId: string,
  prerequisiteTopicId: string,
): Promise<{ prerequisiteTopic: Topic; topic: Topic }> =>
  detachUniqueNodes<Topic, TopicHasPrerequisiteTopic, Topic>({
    originNode: {
      label: TopicLabel,
      filter: { _id: topicId },
    },
    relationship: {
      label: TopicHasPrerequisiteTopicLabel,
      filter: {},
    },
    destinationNode: {
      label: TopicLabel,
      filter: { _id: prerequisiteTopicId },
    },
  }).then(({ originNode, destinationNode }) => {
    return {
      topic: originNode,
      prerequisiteTopic: destinationNode,
    };
  });

const getTopicPrerequisiteRelations = (filter: { _id: string } | { key: string }, direction: 'OUT' | 'IN'): Promise<{topic: Topic, relationship: TopicHasPrerequisiteTopic}[]> =>
  getRelatedNodes<Topic, TopicHasPrerequisiteTopic, Topic>({
    originNode: {
      label: TopicLabel,
      filter,
    },
    relationship: {
      label: TopicHasPrerequisiteTopicLabel,
      direction,
    },
    destinationNode: {
      label: TopicLabel,
    },
  }).then(items => items.map(item => ({ topic: item.destinationNode, relationship: item.relationship })));

export const getTopicPrerequisites = (filter: { _id: string } | { key: string }) =>
getTopicPrerequisiteRelations(filter, 'OUT');

export const getTopicFollowUps = (filter: { _id: string } | { key: string }) =>
getTopicPrerequisiteRelations(filter, 'IN');




export const getSubTopicsMaxIndex = async (topicId: string): Promise<number | null> => {
  const q = new Query(neo4jQb);

  q.match([
    node('n', TopicLabel, { _id: topicId }),
    relation('in', 'r', TopicIsSubTopicOfTopicLabel),
    node('s', TopicLabel),
  ]);

  q.return({ 'r.index': 'maxIndex' });
  q.orderBy({ 'r.index': 'DESC' });
  q.limit(1);

  const r = await q.run();
  if (!r.length) return null;
  const [maxIndex] = r.map(i => i.maxIndex);

  return maxIndex;
};

export const getTopicCreator = (topicFilter: { _id: string }) =>
getRelatedNode<User>({
  originNode: {
    label: TopicLabel,
    filter: topicFilter,
  },
  relationship: {
    label: UserCreatedTopicLabel,
    filter: {},
  },
  destinationNode: {
    label: UserLabel,
    filter: {},
  },
});