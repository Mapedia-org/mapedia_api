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
import { learningMaterialResolveType, rateLearningMaterialResolver } from './resolvers/learning_materials.resolvers';
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
  getLearningPathRatingResolver
} from './resolvers/learning_paths.resolvers';
import {
  addResourceToDomainResolver,
  addSubResourceResolver,
  attachResourceCoversConceptsResolver,
  attachResourceToDomainResolver,
  createResourceResolver,
  deleteResourceResolver,
  detachResourceCoversConceptsResolver,
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
  detachResourceFromDomainResolver,
  searchResourcesResolver,
  getResourceSeriesParentResourceResolver,
} from './resolvers/resources.resolvers';
import {
  addTagsToResourceResolver,
  removeTagsFromResourceResolver,
  searchResourceTagsResolver,
} from './resolvers/resource_tags.resolvers';
import {
  adminUpdateUserResolver,
  currentUserResolver,
  getCurrentUserCreatedArticlesResolver,
  getCurrentUserCreatedLearningPaths,
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
    attachResourceToDomain: attachResourceToDomainResolver,
    detachResourceFromDomain: detachResourceFromDomainResolver,
    addConceptToDomain: addConceptToDomainResolver,
    updateConceptBelongsToDomain: updateConceptBelongsToDomainResolver,
    updateConcept: updateConceptResolver,
    deleteConcept: deleteConceptResolver,
    attachResourceCoversConcepts: attachResourceCoversConceptsResolver,
    detachResourceCoversConcepts: detachResourceCoversConceptsResolver,
    addTagsToResource: addTagsToResourceResolver,
    removeTagsFromResource: removeTagsFromResourceResolver,
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
    rateLearningMaterial: rateLearningMaterialResolver
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
    searchResourceTags: searchResourceTagsResolver,
    searchResources: searchResourcesResolver,
    getLearningPath: getLearningPathResolver,
    getLearningPathByKey: getLearningPathByKeyResolver
  },
  Article: {
    author: getArticleAuthorResolver,
  },
  User: {
    articles: getUserCreatedArticlesResolver,
  },
  CurrentUser: {
    articles: getCurrentUserCreatedArticlesResolver,
    createdLearningPaths: getCurrentUserCreatedLearningPaths
  },
  Domain: {
    concepts: getDomainConceptsResolver,
    resources: getDomainResourcesResolver,
    subDomains: getDomainSubDomainsResolver,
    parentDomains: getDomainParentDomainsResolver,
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
  },
  LearningPath: {
    resourceItems: getLearningPathResourceItemsResolver,
    complementaryResources: getLearningPathComplementaryResourcesResolver,
    rating: getLearningPathRatingResolver
  },
  LearningMaterial: {
    __resolveType: learningMaterialResolveType
  },
  Date: GraphQLDateTime,
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
