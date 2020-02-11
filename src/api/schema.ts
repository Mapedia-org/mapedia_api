import { makeExecutableSchema } from 'apollo-server-koa';
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
  addConceptToDomainResolver,
  deleteConceptResolver,
  getConceptCoveredByResourcesResolver,
  getConceptDomainResolver,
  getConceptResolver,
  updateConceptResolver,
  getConceptByKeyResolver,
  getConceptKnownResolver,
  setConceptsKnownResolver,
  setConceptsUnKnownResolver,
} from './resolvers/concepts.resolvers';
import {
  createDomainResolver,
  deleteDomainResolver,
  getDomainByKeyResolver,
  getDomainConceptsResolver,
  getDomainResourcesResolver,
  searchDomainsResolver,
  updateDomainResolver,
} from './resolvers/domains.resolvers';
import {
  addResourceToDomainResolver,
  attachResourceCoversConceptsResolver,
  attachResourceToDomainResolver,
  createResourceResolver,
  detachResourceCoversConceptsResolver,
  getResourceByIdResolver,
  getResourceCoveredConceptsResolver,
  getResourceDomainsResolver,
  getResourceTagsResolver,
  updateResourceResolver,
} from './resolvers/resources.resolvers';
import {
  adminUpdateUserResolver,
  currentUserResolver,
  getCurrentUserCreatedArticlesResolver,
  getUserCreatedArticlesResolver,
  getUserResolver,
  loginResolver,
  registerResolver,
} from './resolvers/users.resolvers';
import { APIResolvers } from './schema/types';
import { APIContext } from './server';
import {
  searchResourceTagsResolver,
  addTagsToResourceResolver,
  removeTagsFromResourceResolver,
} from './resolvers/resource_tags.resolvers';

export const typeDefs = importSchema('./src/api/schema/schema.graphql');

const resolvers: APIResolvers<APIContext> = {
  Mutation: {
    login: loginResolver,
    register: registerResolver,
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
    attachResourceToDomain: attachResourceToDomainResolver,
    addConceptToDomain: addConceptToDomainResolver,
    updateConcept: updateConceptResolver,
    deleteConcept: deleteConceptResolver,
    attachResourceCoversConcepts: attachResourceCoversConceptsResolver,
    detachResourceCoversConcepts: detachResourceCoversConceptsResolver,
    addTagsToResource: addTagsToResourceResolver,
    removeTagsFromResource: removeTagsFromResourceResolver,
    setConceptsKnown: setConceptsKnownResolver,
    setConceptsUnknown: setConceptsUnKnownResolver,
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
    getConceptByKey: getConceptByKeyResolver,
    searchResourceTags: searchResourceTagsResolver,
  },
  Article: {
    author: getArticleAuthorResolver,
  },
  User: {
    articles: getUserCreatedArticlesResolver,
  },
  CurrentUser: {
    articles: getCurrentUserCreatedArticlesResolver,
  },
  Domain: {
    concepts: getDomainConceptsResolver,
    resources: getDomainResourcesResolver,
  },
  Concept: {
    domain: getConceptDomainResolver,
    coveredByResources: getConceptCoveredByResourcesResolver,
    known: getConceptKnownResolver,
  },
  Resource: {
    coveredConcepts: getResourceCoveredConceptsResolver,
    domains: getResourceDomainsResolver,
    tags: getResourceTagsResolver,
  },
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
