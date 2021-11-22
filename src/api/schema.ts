import { makeExecutableSchema } from 'apollo-server-koa';
import { GraphQLScalarType } from 'graphql';
import { importSchema } from 'graphql-import';
import {
  createArticleResolver,
  deleteArticleResolver,
  getArticleAuthorResolver,
  getArticleByKeyResolver,
  listArticlesResolver,
  updateArticleResolver,
} from './resolvers/articles.resolvers';
import {
  addConceptReferencesConceptResolver,
  addConceptToDomainResolver,
  deleteConceptResolver,
  getConceptCoveredByResourcesResolver,
  getConceptDomainResolver,
  getConceptKnownResolver,
  getConceptReferencedByConceptsResolver,
  getConceptReferencingConceptsResolver,
  getConceptResolver,
  getConceptSizeResolver,
  getDomainConceptByKeyResolver,
  removeConceptReferencesConceptResolver,
  setConceptsKnownResolver,
  setConceptsUnKnownResolver,
  updateConceptBelongsToDomainResolver,
  updateConceptResolver,
  getConceptSubTopicsResolver,
  getConceptParentTopicResolver,
} from './resolvers/concepts.resolvers';
import {
  createDomainResolver,
  deleteDomainResolver,
  getDomainByKeyResolver,
  getDomainConceptsResolver,
  getDomainConceptTotalCountResolver,
  getDomainLearningGoalsResolver,
  getDomainLearningMaterialsResolver,
  getDomainLearningMaterialsTotalCountResolver,
  getDomainLearningPathsResolver,
  getDomainParentTopicsResolver,
  getDomainResourcesResolver,
  getDomainSizeResolver,
  getDomainSubTopicsResolver,
  searchDomainsResolver,
  updateDomainResolver,
} from './resolvers/domains.resolvers';
import {
  attachLearningGoalDependencyResolver,
  attachLearningGoalRequiresSubGoalResolver,
  attachLearningGoalToDomainResolver,
  createLearningGoalResolver,
  deleteLearningGoalResolver,
  detachLearningGoalDependencyResolver,
  detachLearningGoalFromDomainResolver,
  detachLearningGoalRequiresSubGoalResolver,
  getDomainLearningGoalByKeyResolver,
  getLearningGoalByKeyResolver,
  getLearningGoalCreatedByResolver,
  getLearningGoalDependantsLearningGoalsResolver,
  getLearningGoalDependsOnLearningGoalsResolver,
  getLearningGoalDomainResolver,
  getLearningGoalProgressResolver,
  getLearningGoalRatingResolver,
  getLearningGoalRelevantLearningMaterialsResolver,
  getLearningGoalRequiredInGoalsResolver,
  getLearningGoalRequiredSubGoalsResolver,
  getLearningGoalSizeResolver,
  getLearningGoalStartedByResolver,
  getLearningGoalStartedResolver,
  getLearningGoalSubTopicsResolver,
  indexLearningGoalResolver,
  publishLearningGoalResolver,
  rateLearningGoalResolver,
  searchLearningGoalsResolver,
  startLearningGoalResolver,
  updateLearningGoalResolver,
} from './resolvers/learning_goals.resolvers';
import {
  addLearningMaterialOutcomeResolver,
  addLearningMaterialPrerequisiteResolver,
  attachLearningMaterialCoversConceptsResolver,
  attachLearningMaterialToDomainResolver,
  detachLearningMaterialCoversConceptsResolver,
  detachLearningMaterialFromDomainResolver,
  getLearningMaterialOutcomesResolver,
  getLearningMaterialPrerequisitesResolver,
  learningMaterialResolveType,
  rateLearningMaterialResolver,
  removeLearningMaterialOutcomeResolver,
  removeLearningMaterialPrerequisiteResolver,
} from './resolvers/learning_materials.resolvers';
import {
  addTagsToLearningMaterialResolver,
  removeTagsFromLearningMaterialResolver,
  searchLearningMaterialTagsResolver,
} from './resolvers/learning_material_tags.resolvers';
import {
  addComplementaryResourceToLearningPathResolver,
  completeLearningPathResolver,
  createLearningPathResolver,
  deleteLearningPathResolver,
  getLearningPathByKeyResolver,
  getLearningPathComplementaryResourcesResolver,
  getLearningPathCoveredConceptsByDomainResolver,
  getLearningPathCoveredConceptsResolver,
  getLearningPathCreatedByResolver,
  getLearningPathDomainsResolver,
  getLearningPathRatingResolver,
  getLearningPathResolver,
  getLearningPathResourceItemsResolver,
  getLearningPathStartedByResolver,
  getLearningPathStartedResolver,
  getLearningPathTagsResolver,
  removeComplementaryResourceFromLearningPathResolver,
  startLearningPathResolver,
  updateLearningPathResolver,
} from './resolvers/learning_paths.resolvers';
import { getHomePageDataResolver, globalSearchResolver, getTopLevelDomainsResolver } from './resolvers/misc.resolvers';
import {
  addSubResourceResolver,
  addSubResourceToSeriesResolver,
  analyzeResourceUrlResolver,
  createResourceResolver,
  createSubResourceSeriesResolver,
  deleteResourceResolver,
  getResourceByIdResolver,
  getResourceConsumedResolver,
  getResourceCoveredConceptsByDomainResolver,
  getResourceCoveredConceptsResolver,
  getResourceCreatorResolver,
  getResourceDomainsResolver,
  getResourceNextResourceResolver,
  getResourceParentResourcesResolver,
  getResourcePreviousResourceResolver,
  getResourceRatingResolver,
  getResourceSeriesParentResourceResolver,
  getResourceSubResourceSeriesResolver,
  getResourceSubResourcesResolver,
  getResourceTagsResolver,
  getResourceUpvotesResolver,
  searchResourcesResolver,
  setResourcesConsumedResolver,
  updateResourceResolver,
  voteResourceResolver,
} from './resolvers/resources.resolvers';
import {
  checkTopicKeyAvailabilityResolver,
  searchSubTopicsResolver,
  searchTopicsResolver,
  attachTopicIsSubTopicOfTopicResolver,
  updateTopicIsSubTopicOfTopicResolver,
  detachTopicIsSubTopicOfTopicResolver,
  getTopicByIdResolver,
  getTopicParentTopicResolver,
  getTopicSubTopicsResolver,
  getTopicSubTopicsTotalCountResolver,
  getTopicLearningMaterialsResolver,
  getTopicLearningMaterialsTotalCountResolver,
  getTopicPrerequisitesResolver,
  getTopicFollowUpsResolver,
} from './resolvers/topics.resolvers';
import { addTopicHasPrerequisiteTopicResolver, removeTopicHasPrerequisiteTopicResolver } from './resolvers/relationships/topic_has_prerequisite_topic.resolvers';
import {
  adminUpdateUserResolver,
  currentUserResolver,
  getCurrentUserConsumedResourcesResolver,
  getCurrentUserCreatedArticlesResolver,
  getCurrentUserCreatedLearningGoalsResolver,
  getCurrentUserCreatedLearningPathsResolver,
  getCurrentUserStartedLearningGoalsResolver,
  getCurrentUserStartedLearningPathsResolver,
  getUserCreatedArticlesResolver,
  getUserResolver,
  loginGoogleResolver,
  loginResolver,
  registerGoogleResolver,
  registerResolver,
  verifyEmailAddressResolver,
  triggerResetPasswordResolver,
  resetPasswordResolver,
  updateCurrentUserResolver,
} from './resolvers/users.resolvers';
import { APIResolvers } from './schema/types';
import { APIContext } from './server';
import { LearningGoalType } from '../entities/LearningGoal';

export const typeDefs = importSchema('./src/api/schema/schema.graphql');

const resolvers: APIResolvers<APIContext> = {
  Mutation: {
    login: loginResolver,
    loginGoogle: loginGoogleResolver,
    register: registerResolver,
    registerGoogle: registerGoogleResolver,
    verifyEmailAddress: verifyEmailAddressResolver,
    adminUpdateUser: adminUpdateUserResolver,
    updateArticle: updateArticleResolver,
    createArticle: createArticleResolver,
    deleteArticle: deleteArticleResolver,
    createDomain: createDomainResolver,
    updateDomain: updateDomainResolver,
    deleteDomain: deleteDomainResolver,
    createResource: createResourceResolver,
    updateResource: updateResourceResolver,
    deleteResource: deleteResourceResolver,
    attachLearningMaterialToDomain: attachLearningMaterialToDomainResolver,
    detachLearningMaterialFromDomain: detachLearningMaterialFromDomainResolver,
    addConceptToDomain: addConceptToDomainResolver,
    updateConceptBelongsToDomain: updateConceptBelongsToDomainResolver,
    updateConcept: updateConceptResolver,
    deleteConcept: deleteConceptResolver,
    attachLearningMaterialCoversConcepts: attachLearningMaterialCoversConceptsResolver,
    detachLearningMaterialCoversConcepts: detachLearningMaterialCoversConceptsResolver,
    addTagsToLearningMaterial: addTagsToLearningMaterialResolver,
    removeTagsFromLearningMaterial: removeTagsFromLearningMaterialResolver,
    setConceptsKnown: setConceptsKnownResolver,
    setConceptsUnknown: setConceptsUnKnownResolver,
    setResourcesConsumed: setResourcesConsumedResolver,
    voteResource: voteResourceResolver,
    addConceptReferencesConcept: addConceptReferencesConceptResolver,
    removeConceptReferencesConcept: removeConceptReferencesConceptResolver,
    addSubResource: addSubResourceResolver,
    createSubResourceSeries: createSubResourceSeriesResolver,
    addSubResourceToSeries: addSubResourceToSeriesResolver,
    createLearningPath: createLearningPathResolver,
    updateLearningPath: updateLearningPathResolver,
    deleteLearningPath: deleteLearningPathResolver,
    addComplementaryResourceToLearningPath: addComplementaryResourceToLearningPathResolver,
    removeComplementaryResourceFromLearningPath: removeComplementaryResourceFromLearningPathResolver,
    startLearningPath: startLearningPathResolver,
    completeLearningPath: completeLearningPathResolver,
    rateLearningMaterial: rateLearningMaterialResolver,
    createLearningGoal: createLearningGoalResolver,
    updateLearningGoal: updateLearningGoalResolver,
    deleteLearningGoal: deleteLearningGoalResolver,
    attachLearningGoalToDomain: attachLearningGoalToDomainResolver,
    detachLearningGoalFromDomain: detachLearningGoalFromDomainResolver,
    addLearningMaterialPrerequisite: addLearningMaterialPrerequisiteResolver,
    removeLearningMaterialPrerequisite: removeLearningMaterialPrerequisiteResolver,
    addLearningMaterialOutcome: addLearningMaterialOutcomeResolver,
    removeLearningMaterialOutcome: removeLearningMaterialOutcomeResolver,
    attachLearningGoalRequiresSubGoal: attachLearningGoalRequiresSubGoalResolver,
    detachLearningGoalRequiresSubGoal: detachLearningGoalRequiresSubGoalResolver,
    startLearningGoal: startLearningGoalResolver,
    publishLearningGoal: publishLearningGoalResolver,
    indexLearningGoal: indexLearningGoalResolver,
    rateLearningGoal: rateLearningGoalResolver,
    attachLearningGoalDependency: attachLearningGoalDependencyResolver,
    detachLearningGoalDependency: detachLearningGoalDependencyResolver,
    attachTopicIsSubTopicOfTopic: attachTopicIsSubTopicOfTopicResolver,
    updateTopicIsSubTopicOfTopic: updateTopicIsSubTopicOfTopicResolver,
    detachTopicIsSubTopicOfTopic: detachTopicIsSubTopicOfTopicResolver,
    addTopicHasPrerequisiteTopic: addTopicHasPrerequisiteTopicResolver,
    removeTopicHasPrerequisiteTopic: removeTopicHasPrerequisiteTopicResolver,
    triggerResetPassword: triggerResetPasswordResolver,
    resetPassword: resetPasswordResolver,
    updateCurrentUser: updateCurrentUserResolver,
  },
  Query: {
    currentUser: currentUserResolver,
    getArticleByKey: getArticleByKeyResolver,
    listArticles: listArticlesResolver,
    getUser: getUserResolver,
    searchDomains: searchDomainsResolver,
    getDomainByKey: getDomainByKeyResolver,
    getResourceById: getResourceByIdResolver,
    getConcept: getConceptResolver,
    getDomainConceptByKey: getDomainConceptByKeyResolver,
    searchLearningMaterialTags: searchLearningMaterialTagsResolver,
    searchResources: searchResourcesResolver,
    getLearningPath: getLearningPathResolver,
    getLearningPathByKey: getLearningPathByKeyResolver,
    getLearningGoalByKey: getLearningGoalByKeyResolver,
    getDomainLearningGoalByKey: getDomainLearningGoalByKeyResolver,
    searchLearningGoals: searchLearningGoalsResolver,
    getTopicById: getTopicByIdResolver,
    searchTopics: searchTopicsResolver,
    searchSubTopics: searchSubTopicsResolver,
    checkTopicKeyAvailability: checkTopicKeyAvailabilityResolver,
    analyzeResourceUrl: analyzeResourceUrlResolver,
    getHomePageData: getHomePageDataResolver,
    globalSearch: globalSearchResolver,
    getTopLevelDomains: getTopLevelDomainsResolver,
  },
  Article: {
    author: getArticleAuthorResolver,
  },
  User: {
    articles: getUserCreatedArticlesResolver,
  },
  CurrentUser: {
    articles: getCurrentUserCreatedArticlesResolver,
    createdLearningPaths: getCurrentUserCreatedLearningPathsResolver,
    startedLearningPaths: getCurrentUserStartedLearningPathsResolver,
    createdLearningGoals: getCurrentUserCreatedLearningGoalsResolver,
    startedLearningGoals: getCurrentUserStartedLearningGoalsResolver,
    consumedResources: getCurrentUserConsumedResourcesResolver,
  },
  Domain: {
    concepts: getDomainConceptsResolver,
    conceptTotalCount: getDomainConceptTotalCountResolver,
    resources: getDomainResourcesResolver,
    learningPaths: getDomainLearningPathsResolver,
    learningMaterials: getDomainLearningMaterialsResolver,
    learningMaterialsTotalCount: getDomainLearningMaterialsTotalCountResolver,
    learningGoals: getDomainLearningGoalsResolver,
    subTopics: getDomainSubTopicsResolver,
    parentTopics: getDomainParentTopicsResolver,
    size: getDomainSizeResolver,
  },
  Concept: {
    domain: getConceptDomainResolver,
    coveredByResources: getConceptCoveredByResourcesResolver,
    known: getConceptKnownResolver,
    referencingConcepts: getConceptReferencingConceptsResolver,
    referencedByConcepts: getConceptReferencedByConceptsResolver,
    subTopics: getConceptSubTopicsResolver,
    parentTopic: getConceptParentTopicResolver,
    size: getConceptSizeResolver,
  },
  Resource: {
    coveredConcepts: getResourceCoveredConceptsResolver,
    coveredConceptsByDomain: getResourceCoveredConceptsByDomainResolver,
    domains: getResourceDomainsResolver,
    tags: getResourceTagsResolver,
    upvotes: getResourceUpvotesResolver,
    rating: getResourceRatingResolver,
    consumed: getResourceConsumedResolver,
    creator: getResourceCreatorResolver,
    subResources: getResourceSubResourcesResolver,
    parentResources: getResourceParentResourcesResolver,
    seriesParentResource: getResourceSeriesParentResourceResolver,
    subResourceSeries: getResourceSubResourceSeriesResolver,
    previousResource: getResourcePreviousResourceResolver,
    nextResource: getResourceNextResourceResolver,
    prerequisites: getLearningMaterialPrerequisitesResolver,
    outcomes: getLearningMaterialOutcomesResolver,
  },
  LearningPath: {
    resourceItems: getLearningPathResourceItemsResolver,
    complementaryResources: getLearningPathComplementaryResourcesResolver,
    rating: getLearningPathRatingResolver,
    tags: getLearningPathTagsResolver,
    domains: getLearningPathDomainsResolver,
    coveredConcepts: getLearningPathCoveredConceptsResolver,
    coveredConceptsByDomain: getLearningPathCoveredConceptsByDomainResolver,
    started: getLearningPathStartedResolver,
    createdBy: getLearningPathCreatedByResolver,
    startedBy: getLearningPathStartedByResolver,
    prerequisites: getLearningMaterialPrerequisitesResolver,
    outcomes: getLearningMaterialOutcomesResolver,
  },
  LearningGoal: {
    domain: getLearningGoalDomainResolver,
    requiredSubGoals: getLearningGoalRequiredSubGoalsResolver,
    requiredInGoals: getLearningGoalRequiredInGoalsResolver,
    createdBy: getLearningGoalCreatedByResolver,
    started: getLearningGoalStartedResolver,
    startedBy: getLearningGoalStartedByResolver,
    progress: getLearningGoalProgressResolver,
    rating: getLearningGoalRatingResolver,
    relevantLearningMaterials: getLearningGoalRelevantLearningMaterialsResolver,
    dependsOnLearningGoals: getLearningGoalDependsOnLearningGoalsResolver,
    dependantLearningGoals: getLearningGoalDependantsLearningGoalsResolver,
    size: getLearningGoalSizeResolver,
    subTopics: getLearningGoalSubTopicsResolver,
  },
  LearningMaterial: {
    __resolveType: learningMaterialResolveType,
  },
  Topic: {
    parentTopic: getTopicParentTopicResolver,
    subTopics: getTopicSubTopicsResolver,
    subTopicsTotalCount: getTopicSubTopicsTotalCountResolver,
    learningMaterials: getTopicLearningMaterialsResolver,
    learningMaterialsTotalCount: getTopicLearningMaterialsTotalCountResolver,
    prerequisites: getTopicPrerequisitesResolver,
    followUps: getTopicFollowUpsResolver
  },
  SubGoal: {
    __resolveType: obj => {
      if (obj.topicType === TopicType.Concept) return 'Concept';
      if (obj.topicType === TopicType.LearningGoal) return 'LearningGoal';
      throw new Error('Unreachable code, issue in returning SubGoal which isnt a Concept or LG');
    },
  },
  SearchResultEntity: {
    __resolveType: obj => {
      //@ts-ignore
      if (!obj.type && !obj.topicType) return 'LearningPath';
      //@ts-ignore
      if (!obj.topicType) return 'Resource';
      //@ts-ignore
      // if (obj.topicType === TopicType.Concept) return 'Concept';
      //@ts-ignore
      if (obj.type === LearningGoalType.Roadmap || obj.type === LearningGoalType.SubGoal) return 'LearningGoal';
      //@ts-ignore
      // if (obj.topicType === TopicType.Domain) return 'Domain';
      return 'Topic'
      throw new Error('Unreachable code, issue in returning SubGoal which isnt a Concept or LG');
    },
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description:
      'Date scalar serialized as ISO UTC string, parsed from JS Date time (ms since Unix epoch, from Date.now() or new Date().getTime()',
    serialize(value: number) {
      return new Date(value).toISOString();
    },
    parseValue(value: string) {
      return new Date(value).getTime();
    },
    parseLiteral(ast) {
      ast.kind === 'StringValue' ? new Date(ast.value).getTime() : undefined;
    },
  }),
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
