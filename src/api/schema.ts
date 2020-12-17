import { makeExecutableSchema } from 'apollo-server-koa';
import { importSchema } from 'graphql-import';
import { GraphQLDateTime } from 'graphql-iso-date';
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
  getDomainConceptByKeyResolver,
  getConceptCoveredByResourcesResolver,
  getConceptDomainResolver,
  getConceptKnownResolver,
  getConceptReferencedByConceptsResolver,
  getConceptReferencingConceptsResolver,
  getConceptResolver,
  removeConceptReferencesConceptResolver,
  setConceptsKnownResolver,
  setConceptsUnKnownResolver,
  updateConceptBelongsToDomainResolver,
  updateConceptResolver,
  getConceptSubConceptsResolver,
  getConceptParentConceptsResolver,
  removeConceptBelongsToConceptResolver,
  addConceptBelongsToConceptResolver,
} from './resolvers/concepts.resolvers';
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
  createDomainResolver,
  deleteDomainResolver,
  getDomainByKeyResolver,
  getDomainConceptsResolver,
  getDomainResourcesResolver,
  searchDomainsResolver,
  updateDomainResolver,
  addDomainBelongsToDomainResolver,
  removeDomainBelongsToDomainResolver,
  getDomainSubDomainsResolver,
  getDomainParentDomainsResolver,
  getDomainLearningPathsResolver,
  getDomainLearningMaterialsResolver,
  getDomainLearningGoalsResolver,
  // getDomainSubTopicsResolver,
} from './resolvers/domains.resolvers';
import {
  addComplementaryResourceToLearningPathResolver,
  createLearningPathResolver,
  deleteLearningPathResolver,
  getLearningPathByKeyResolver,
  getLearningPathComplementaryResourcesResolver,
  getLearningPathResolver,
  getLearningPathResourceItemsResolver,
  removeComplementaryResourceFromLearningPathResolver,
  updateLearningPathResolver,
  getLearningPathRatingResolver,
  getLearningPathTagsResolver,
  getLearningPathDomainsResolver,
  getLearningPathCoveredConceptsResolver,
  getLearningPathCoveredConceptsByDomainResolver,
  startLearningPathResolver,
  getLearningPathStartedResolver,
  getLearningPathCreatedByResolver,
  getLearningPathStartedByResolver,
  completeLearningPathResolver,
} from './resolvers/learning_paths.resolvers';
import {
  addResourceToDomainResolver,
  addSubResourceResolver,
  createResourceResolver,
  deleteResourceResolver,
  getResourceByIdResolver,
  getResourceConsumedResolver,
  getResourceCoveredConceptsResolver,
  getResourceCreatorResolver,
  getResourceDomainsResolver,
  getResourceRatingResolver,
  getResourceTagsResolver,
  getResourceUpvotesResolver,
  setResourcesConsumedResolver,
  updateResourceResolver,
  voteResourceResolver,
  getResourceParentResourcesResolver,
  getResourceSubResourcesResolver,
  addSubResourceToSeriesResolver,
  createSubResourceSeriesResolver,
  getResourceSubResourceSeriesResolver,
  getResourcePreviousResourceResolver,
  getResourceNextResourceResolver,
  getResourceCoveredConceptsByDomainResolver,
  searchResourcesResolver,
  getResourceSeriesParentResourceResolver,
} from './resolvers/resources.resolvers';
import {
  addTagsToLearningMaterialResolver,
  searchLearningMaterialTagsResolver,
  removeTagsFromLearningMaterialResolver,
} from './resolvers/learning_material_tags.resolvers';
import {
  adminUpdateUserResolver,
  currentUserResolver,
  getCurrentUserCreatedArticlesResolver,
  getCurrentUserCreatedLearningPaths,
  getCurrentUserStartedLearningPaths,
  getUserCreatedArticlesResolver,
  getUserResolver,
  loginGoogleResolver,
  loginResolver,
  registerGoogleResolver,
  registerResolver,
  verifyEmailAddressResolver,
} from './resolvers/users.resolvers';
import { APIResolvers } from './schema/types';
import { APIContext } from './server';
import {
  addLearningGoalToDomainResolver,
  // attachLearningGoalToDomainResolver,
  deleteLearningGoalResolver,
  // detachLearningGoalFromDomainResolver,
  getLearningGoalByKeyResolver,
  updateLearningGoalResolver,
  getLearningGoalDomainResolver,
  getDomainLearningGoalByKeyResolver,
  createLearningGoalResolver,
  searchLearningGoalsResolver,
} from './resolvers/learning_goals.resolvers';
import { topicResolveType } from './resolvers/topics.resolvers';

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
    addResourceToDomain: addResourceToDomainResolver,
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
    addConceptBelongsToConcept: addConceptBelongsToConceptResolver,
    removeConceptBelongsToConcept: removeConceptBelongsToConceptResolver,
    addDomainBelongsToDomain: addDomainBelongsToDomainResolver,
    removeDomainBelongsToDomain: removeDomainBelongsToDomainResolver,
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
    addLearningGoalToDomain: addLearningGoalToDomainResolver,
    // attachLearningGoalToDomain: attachLearningGoalToDomainResolver,
    // detachLearningGoalFromDomain: detachLearningGoalFromDomainResolver,
    addLearningMaterialPrerequisite: addLearningMaterialPrerequisiteResolver,
    removeLearningMaterialPrerequisite: removeLearningMaterialPrerequisiteResolver,
    addLearningMaterialOutcome: addLearningMaterialOutcomeResolver,
    removeLearningMaterialOutcome: removeLearningMaterialOutcomeResolver,
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
  },
  Article: {
    author: getArticleAuthorResolver,
  },
  User: {
    articles: getUserCreatedArticlesResolver,
  },
  CurrentUser: {
    articles: getCurrentUserCreatedArticlesResolver,
    createdLearningPaths: getCurrentUserCreatedLearningPaths,
    startedLearningPaths: getCurrentUserStartedLearningPaths,
  },
  Domain: {
    concepts: getDomainConceptsResolver,
    resources: getDomainResourcesResolver,
    subDomains: getDomainSubDomainsResolver,
    parentDomains: getDomainParentDomainsResolver,
    learningPaths: getDomainLearningPathsResolver,
    learningMaterials: getDomainLearningMaterialsResolver,
    learningGoals: getDomainLearningGoalsResolver,
    // subTopics: getDomainSubTopicsResolver,
  },
  Concept: {
    domain: getConceptDomainResolver,
    coveredByResources: getConceptCoveredByResourcesResolver,
    known: getConceptKnownResolver,
    referencingConcepts: getConceptReferencingConceptsResolver,
    referencedByConcepts: getConceptReferencedByConceptsResolver,
    subConcepts: getConceptSubConceptsResolver,
    parentConcepts: getConceptParentConceptsResolver,
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
  },
  LearningMaterial: {
    __resolveType: learningMaterialResolveType,
  },
  Topic: {
    __resolveType: topicResolveType,
  },
  Date: GraphQLDateTime,
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
