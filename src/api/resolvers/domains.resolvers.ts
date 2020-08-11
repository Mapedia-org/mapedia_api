import { Domain } from '../../entities/Domain';
import { NotFoundError } from '../../errors/NotFoundError';
import {
  createDomain,
  deleteDomain,
  findDomain,
  updateDomain,
  searchDomains,
  getDomainConcepts,
} from '../../repositories/domains.repository';
import { getDomainResources } from '../../services/resources.service';
import { UnauthorizedError } from '../errors/UnauthenticatedError';
import { APIDomain, APIMutationResolvers, APIQueryResolvers, UserRole, APIDomainResolvers } from '../schema/types';
import { nullToUndefined } from '../util/nullToUndefined';
import { toAPIResource } from './resources.resolvers';

function toAPIDomain(domain: Domain): APIDomain {
  return domain;
}

export const searchDomainsResolver: APIQueryResolvers['searchDomains'] = async (
  _parent,
  { options: { query, pagination } }
) => {
  const domains = await searchDomains(nullToUndefined({ query }), nullToUndefined(pagination));
  return { items: domains.map(toAPIDomain) };
};

export const createDomainResolver: APIMutationResolvers['createDomain'] = async (_parent, { payload }, ctx) => {
  if (!ctx.user || ctx.user.role !== UserRole.ADMIN)
    throw new UnauthorizedError('Must be logged in and an admin to create a domain');
  const createdDomain = await createDomain({ _id: ctx.user._id }, nullToUndefined(payload));
  return toAPIDomain(createdDomain);
};

export const getDomainByKeyResolver: APIQueryResolvers['getDomainByKey'] = async (_parent, { key }) => {
  const domain = await findDomain({ key });
  if (!domain) throw new NotFoundError('Domain', key, 'key');
  return toAPIDomain(domain);
};

export const updateDomainResolver: APIMutationResolvers['updateDomain'] = async (_parent, { id, payload }, ctx) => {
  if (!ctx.user || ctx.user.role !== UserRole.ADMIN)
    throw new UnauthorizedError('Must be logged in and an admin to update a domain');

  const updatedDomain = await updateDomain({ _id: id }, nullToUndefined(payload));
  if (!updatedDomain) throw new NotFoundError('Domain', id, 'id');
  return toAPIDomain(updatedDomain);
};

export const deleteDomainResolver: APIMutationResolvers['deleteDomain'] = async (_parent, { id }, ctx) => {
  if (!ctx.user || ctx.user.role !== UserRole.ADMIN)
    throw new UnauthorizedError('Must be logged in and an admin to delete a domain');

  const { deletedCount } = await deleteDomain({ _id: id });
  if (!deletedCount) throw new NotFoundError('Domain', id, 'id');
  return { _id: id, success: true };
};

export const getDomainConceptsResolver: APIDomainResolvers['concepts'] = async (domain, { options }, ctx) => {
  const { sorting } = options;
  return { items: await getDomainConcepts({ _id: domain._id }, sorting || undefined) };
};

export const getDomainResourcesResolver: APIDomainResolvers['resources'] = async (domain, { options }, { user }) => {
  return {
    items: (await getDomainResources(domain._id, user?._id, nullToUndefined(options))).map(toAPIResource),
  };
};
