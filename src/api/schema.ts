import { makeExecutableSchema } from 'apollo-server-koa';
import { GraphQLScalarType } from 'graphql';
import { importSchema } from 'graphql-import';
import { LearningGoalType } from '../entities/LearningGoal';
import {
  createArticleResolver,
  deleteArticleResolver,
  getArticleAuthorResolver,
  getArticleByKeyResolver,
  listArticlesResolver,
  updateArticleResolver,
} from './resolvers/articles.resolvers';

import {
  attachLearningGoalDependencyResolver,
  attachLearningGoalRequiresSubGoalResolver,
  checkLearningGoalKeyAvailabilityResolver,
  createLearningGoalResolver,
  deleteLearningGoalResolver,
  detachLearningGoalDependencyResolver,
  detachLearningGoalRequiresSubGoalResolver,
  getLearningGoalByKeyResolver,
  getLearningGoalCreatedByResolver,
  getLearningGoalDependantsLearningGoalsResolver,
  getLearningGoalDependsOnLearningGoalsResolver,
  getLearningGoalProgressResolver,
  getLearningGoalRatingResolver,
  getLearningGoalRelevantLearningMaterialsResolver,
  getLearningGoalRequiredInGoalsResolver,
  getLearningGoalRequiredSubGoalsResolver,
  getLearningGoalShowedInResolver,
  getLearningGoalStartedByResolver,
  getLearningGoalStartedResolver,
  hideLearningGoalFromTopicResolver,
  indexLearningGoalResolver,
  publishLearningGoalResolver,
  rateLearningGoalResolver,
  searchLearningGoalsResolver,
  showLearningGoalInTopicResolver,
  startLearningGoalResolver,
  updateLearningGoalResolver,
} from './resolvers/learning_goals.resolvers';
import {
  getLearningMaterialCoveredSubTopicsResolver,
  getLearningMaterialCreatedByResolver,
  getLearningMaterialPrerequisitesResolver,
  getLearningMaterialShowedInResolver,
  hideLearningMaterialFromTopicResolver,
  learningMaterialResolveType,
  rateLearningMaterialResolver,
  showLearningMaterialInTopicResolver,
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
  getLearningPathByIdResolver,
  getLearningPathByKeyResolver,
  getLearningPathComplementaryResourcesResolver,
  getLearningPathRatingResolver,
  getLearningPathResourceItemsResolver,
  getLearningPathStartedByResolver,
  getLearningPathStartedResolver,
  getLearningPathTagsResolver,
  removeComplementaryResourceFromLearningPathResolver,
  startLearningPathResolver,
  updateLearningPathResolver,
} from './resolvers/learning_paths.resolvers';
import { getHomePageDataResolver, getTopLevelTopicsResolver, globalSearchResolver } from './resolvers/misc.resolvers';
import {
  attachLearningMaterialCoversTopicsResolver,
  detachLearningMaterialCoversTopicsResolver,
} from './resolvers/relationships/learning_material_covers_topic.resolvers';
import {
  addLearningMaterialHasPrerequisiteTopicResolver,
  removeLearningMaterialHasPrerequisiteTopicResolver,
} from './resolvers/relationships/learning_material_has_prerequisite_topic.resolvers';
import {
  addTopicHasPrerequisiteTopicResolver,
  removeTopicHasPrerequisiteTopicResolver,
} from './resolvers/relationships/topic_has_prerequisite_topic.resolvers';
import {
  attachTopicIsPartOfTopicResolver,
  detachTopicIsPartOfTopicResolver,
  updateTopicIsPartOfTopicResolver,
} from './resolvers/relationships/topic_is_part_of_topic.resolvers';
import {
  attachTopicIsSubTopicOfTopicResolver,
  detachTopicIsSubTopicOfTopicResolver,
  updateTopicIsSubTopicOfTopicResolver,
} from './resolvers/relationships/topic_is_subtopic_of_topic.resolvers';
import {
  addSubResourceResolver,
  addSubResourceToSeriesResolver,
  analyzeResourceUrlResolver,
  createResourceResolver,
  createSubResourceSeriesResolver,
  deleteResourceResolver,
  getResourceByIdResolver,
  getResourceConsumedResolver,
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
} from './resolvers/resources.resolvers';
import {
  addSubTopicResolver,
  autocompleteTopicNameResolver,
  checkTopicKeyAvailabilityResolver,
  createDisambiguationFromTopicResolver,
  createTopicResolver,
  deleteTopicResolver,
  getTopicByIdResolver,
  getTopicByKeyResolver,
  getTopicContextTopicResolver,
  getTopicContextualisedTopicsResolver,
  getTopicDisambiguationTopicResolver,
  getTopicFollowUpsResolver,
  getTopicLearningMaterialsResolver,
  getTopicLearningMaterialsTotalCountResolver,
  getTopicParentTopicResolver,
  getTopicPartOfTopicsResolver,
  getTopicPrerequisitesResolver,
  getTopicsCreatedByResolver,
  getTopicSubTopicsResolver,
  getTopicSubTopicsTotalCountResolver,
  getTopicValidContextsFromDisambiguationResolver,
  getTopicValidContextsFromSameNameResolver,
  getTopicValidContextsResolver,
  searchSubTopicsResolver,
  searchTopicsResolver,
  updateTopicContextResolver,
  updateTopicResolver,
} from './resolvers/topics.resolvers';
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
  resetPasswordResolver,
  triggerResetPasswordResolver,
  updateCurrentUserResolver,
  verifyEmailAddressResolver,
} from './resolvers/users.resolvers';
import { APIResolvers } from './schema/types';
import { APIContext } from './server';

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
    createTopic: createTopicResolver,
    addSubTopic: addSubTopicResolver,
    createDisambiguationFromTopic: createDisambiguationFromTopicResolver,
    updateTopic: updateTopicResolver,
    deleteTopic: deleteTopicResolver,
    updateTopicContext: updateTopicContextResolver,
    createResource: createResourceResolver,
    updateResource: updateResourceResolver,
    deleteResource: deleteResourceResolver,
    showLearningMaterialInTopic: showLearningMaterialInTopicResolver,
    hideLearningMaterialFromTopic: hideLearningMaterialFromTopicResolver,
    attachLearningMaterialCoversTopics: attachLearningMaterialCoversTopicsResolver,
    detachLearningMaterialCoversTopics: detachLearningMaterialCoversTopicsResolver,
    addTagsToLearningMaterial: addTagsToLearningMaterialResolver,
    removeTagsFromLearningMaterial: removeTagsFromLearningMaterialResolver,
    setResourcesConsumed: setResourcesConsumedResolver,
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
    showLearningGoalInTopic: showLearningGoalInTopicResolver,
    hideLearningGoalFromTopic: hideLearningGoalFromTopicResolver,
    addLearningMaterialHasPrerequisiteTopic: addLearningMaterialHasPrerequisiteTopicResolver,
    removeLearningMaterialHasPrerequisiteTopic: removeLearningMaterialHasPrerequisiteTopicResolver,
    // addLearningMaterialOutcome: addLearningMaterialOutcomeResolver,
    // removeLearningMaterialOutcome: removeLearningMaterialOutcomeResolver,
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
    attachTopicIsPartOfTopic: attachTopicIsPartOfTopicResolver,
    updateTopicIsPartOfTopic: updateTopicIsPartOfTopicResolver,
    detachTopicIsPartOfTopic: detachTopicIsPartOfTopicResolver,
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
    getResourceById: getResourceByIdResolver,
    searchLearningMaterialTags: searchLearningMaterialTagsResolver,
    searchResources: searchResourcesResolver,
    getLearningPathById: getLearningPathByIdResolver,
    getLearningPathByKey: getLearningPathByKeyResolver,
    getLearningGoalByKey: getLearningGoalByKeyResolver,
    searchLearningGoals: searchLearningGoalsResolver,
    checkLearningGoalKeyAvailability: checkLearningGoalKeyAvailabilityResolver,
    getTopicById: getTopicByIdResolver,
    getTopicByKey: getTopicByKeyResolver,
    searchTopics: searchTopicsResolver,
    searchSubTopics: searchSubTopicsResolver,
    autocompleteTopicName: autocompleteTopicNameResolver,
    checkTopicKeyAvailability: checkTopicKeyAvailabilityResolver,
    analyzeResourceUrl: analyzeResourceUrlResolver,
    getHomePageData: getHomePageDataResolver,
    globalSearch: globalSearchResolver,
    getTopLevelTopics: getTopLevelTopicsResolver,
    getTopicValidContexts: getTopicValidContextsResolver,
    getTopicValidContextsFromSameName: getTopicValidContextsFromSameNameResolver,
    getTopicValidContextsFromDisambiguation: getTopicValidContextsFromDisambiguationResolver,
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
  // Domain: {
  //   concepts: getDomainConceptsResolver,
  //   conceptTotalCount: getDomainConceptTotalCountResolver,
  //   resources: getDomainResourcesResolver,
  //   learningPaths: getDomainLearningPathsResolver,
  //   learningMaterials: getDomainLearningMaterialsResolver,
  //   learningMaterialsTotalCount: getDomainLearningMaterialsTotalCountResolver,
  //   learningGoals: getDomainLearningGoalsResolver,
  //   subTopics: getDomainSubTopicsResolver,
  //   parentTopics: getDomainParentTopicsResolver,
  //   size: getDomainSizeResolver,
  // },
  Resource: {
    coveredSubTopics: getLearningMaterialCoveredSubTopicsResolver,
    showedIn: getLearningMaterialShowedInResolver,
    tags: getResourceTagsResolver,
    upvotes: getResourceUpvotesResolver,
    rating: getResourceRatingResolver,
    consumed: getResourceConsumedResolver,
    subResources: getResourceSubResourcesResolver,
    parentResources: getResourceParentResourcesResolver,
    seriesParentResource: getResourceSeriesParentResourceResolver,
    subResourceSeries: getResourceSubResourceSeriesResolver,
    previousResource: getResourcePreviousResourceResolver,
    nextResource: getResourceNextResourceResolver,
    prerequisites: getLearningMaterialPrerequisitesResolver,
    // outcomes: getLearningMaterialOutcomesResolver,
    createdBy: getLearningMaterialCreatedByResolver,
  },
  LearningPath: {
    coveredSubTopics: getLearningMaterialCoveredSubTopicsResolver,
    showedIn: getLearningMaterialShowedInResolver,
    resourceItems: getLearningPathResourceItemsResolver,
    complementaryResources: getLearningPathComplementaryResourcesResolver,
    rating: getLearningPathRatingResolver,
    tags: getLearningPathTagsResolver,
    // coveredConcepts: getLearningPathCoveredConceptsResolver,
    // coveredConceptsByDomain: getLearningPathCoveredConceptsByDomainResolver,
    prerequisites: getLearningMaterialPrerequisitesResolver,
    // outcomes: getLearningMaterialOutcomesResolver,
    started: getLearningPathStartedResolver,
    createdBy: getLearningMaterialCreatedByResolver,
    startedBy: getLearningPathStartedByResolver,
  },
  LearningGoal: {
    showedIn: getLearningGoalShowedInResolver,
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
    // size: getLearningGoalSizeResolver,
    // subTopics: getLearningGoalSubTopicsResolver,
  },
  LearningMaterial: {
    __resolveType: learningMaterialResolveType,
  },
  Topic: {
    parentTopic: getTopicParentTopicResolver,
    subTopics: getTopicSubTopicsResolver,
    subTopicsTotalCount: getTopicSubTopicsTotalCountResolver,
    contextTopic: getTopicContextTopicResolver,
    disambiguationTopic: getTopicDisambiguationTopicResolver,
    contextualisedTopics: getTopicContextualisedTopicsResolver,
    learningMaterials: getTopicLearningMaterialsResolver,
    learningMaterialsTotalCount: getTopicLearningMaterialsTotalCountResolver,
    prerequisites: getTopicPrerequisitesResolver,
    followUps: getTopicFollowUpsResolver,
    createdBy: getTopicsCreatedByResolver,
    partOfTopics: getTopicPartOfTopicsResolver,
  },
  SubGoal: {
    __resolveType: obj => {
      // if (obj.topicType === TopicType.Concept) return 'Concept';
      //@ts-ignore
      if (Object.values(LearningGoalType).indexOf(obj.type) > -1) return 'LearningGoal';
      return 'Topic';
      throw new Error('Unreachable code, issue in returning SubGoal which isnt a Concept or LG');
    },
  },
  SearchResultEntity: {
    __resolveType: obj => {
      //@ts-ignore
      if (!obj.type && (obj.public === true || obj.public === false)) return 'LearningPath';
      //@ts-ignore
      if (obj.url) return 'Resource';
      //@ts-ignore
      // if (obj.topicType === TopicType.Concept) return 'Concept';
      //@ts-ignore
      if (obj.type === LearningGoalType.Roadmap || obj.type === LearningGoalType.SubGoal) return 'LearningGoal';
      //@ts-ignore
      // if (obj.topicType === TopicType.Domain) return 'Domain';
      return 'Topic';
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
