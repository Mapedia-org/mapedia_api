import { UserInputError } from 'apollo-server-koa';
import { NotFoundError } from '../../errors/NotFoundError';
import { findDomain } from '../../repositories/domains.repository';
import {
  attachLearningGoalRequiresSubGoal,
  attachLearningGoalToDomain,
  countLearningGoalStartedBy,
  createLearningGoal,
  deleteLearningGoal,
  detachLearningGoalRequiresSubGoal,
  findDomainLearningGoalByKey,
  findLearningGoal,
  findLearningGoalCreatedBy,
  getLearningGoalCreator,
  getLearningGoalDomain,
  getLearningGoalRequiredInGoals,
  getLearningGoalRequiredSubGoals,
  getUserStartedLearningGoal,
  searchLearningGoals,
  updateLearningGoal,
  getLearningGoalStartedBy,
} from '../../repositories/learning_goals.repository';
import { findLearningGoalIfAuthorized, startLearningGoal } from '../../services/learning_goals.service';
import { UnauthenticatedError } from '../errors/UnauthenticatedError';
import { APILearningGoalResolvers, APIMutationResolvers, APIQueryResolvers, UserRole } from '../schema/types';
import { restrictAccess } from '../util/auth';
import { nullToUndefined } from '../util/nullToUndefined';
import { generateUrlKey } from '../util/urlKey';

export const getDomainLearningGoalByKeyResolver: APIQueryResolvers['getDomainLearningGoalByKey'] = async (
  _parent,
  { domainKey, contextualLearningGoalKey }
) => {
  const result = await findDomainLearningGoalByKey(domainKey, contextualLearningGoalKey);

  if (!result || !result.learningGoal.publishedAt)
    throw new NotFoundError('LearningGoal', contextualLearningGoalKey, 'contextualLearningGoalKey');
  // await findLearningGoalIfAuthorized({ _id: result.learningGoal._id }, user?._id); TODO: check if necessary (then remove other check).
  return result;
};

export const searchLearningGoalsResolver: APIQueryResolvers['searchLearningGoals'] = async (
  _,
  { options: { query, pagination } }
) => {
  return {
    items: await searchLearningGoals(nullToUndefined({ query }), nullToUndefined(pagination)),
  };
};

export const createLearningGoalResolver: APIMutationResolvers['createLearningGoal'] = async (
  _parent,
  { payload },
  { user }
) => {
  restrictAccess('loggedInUser', user, 'Must be logged in to create a learning goal');
  if (user!.role === UserRole.USER && !!payload.key)
    throw new UserInputError('can not set the key if not an admin or contributor');
  return await createLearningGoal({ _id: user!._id }, nullToUndefined(payload));
};

export const updateLearningGoalResolver: APIMutationResolvers['updateLearningGoal'] = async (
  _,
  { _id, payload },
  { user }
) => {
  if (!user) throw new UnauthenticatedError('Must be logged in');
  if (user.role === UserRole.USER && !!payload.key)
    throw new UserInputError('can not set the key if not an admin or contributor');
  const learningGoal =
    user.role === UserRole.ADMIN ? await findLearningGoal({ _id }) : await findLearningGoalCreatedBy(user._id, { _id });
  if (!learningGoal) throw new NotFoundError('LearningGoal', _id);

  const updatedLearningGoal = await updateLearningGoal({ _id }, nullToUndefined(payload));
  if (!updatedLearningGoal) throw new Error('updateLearningGoalResolver: Should never happen');
  return updatedLearningGoal;
};

export const addLearningGoalToDomainResolver: APIMutationResolvers['addLearningGoalToDomain'] = async (
  _,
  { domainId, payload },
  { user }
) => {
  if (!user) throw new UnauthenticatedError('Must be logged in to add a learning goal');
  const domain = await findDomain({ _id: domainId });
  if (!domain) throw new NotFoundError('Domain', domainId);

  const contextualKey = payload.contextualKey || generateUrlKey(payload.contextualName);
  const createdLearningGoal = await createLearningGoal(
    { _id: user._id },
    {
      name: `${domain.name} - ${payload.contextualName}`,
      key: `${domain.key}_${contextualKey}`,
      description: payload.description || undefined,
      public: payload.public || undefined,
      type: payload.type,
    }
  );

  return await attachLearningGoalToDomain(createdLearningGoal._id, domainId, {
    contextualName: payload.contextualName,
    contextualKey,
  });
};
// export const attachLearningGoalToDomainResolver: APIMutationResolvers['attachLearningGoalToDomain'] = async (
//   _,
//   { domainId, learningGoalId, payload },
//   { user }
// ) => {
//   if (!user) throw new UnauthenticatedError('Must be logged in to attach a learning goal to a domain');
//   const learningGoal = await findLearningGoal({ _id: learningGoalId });
//   if (!learningGoal) throw new NotFoundError('LearningGoal', learningGoalId);
//   return await attachLearningGoalToDomain(learningGoalId, domainId, {
//     contextualKey: payload.contextualKey || learningGoal.key,
//   });
// };
// export const detachLearningGoalFromDomainResolver: APIMutationResolvers['detachLearningGoalFromDomain'] = async (
//   _,
//   { domainId, learningGoalId },
//   { user }
// ) => {
//   if (!user) throw new UnauthenticatedError('Must be logged in to detach a learning goal from a domain');
//   return await detachLearningGoalFromDomain(learningGoalId, domainId);
// };

export const deleteLearningGoalResolver: APIMutationResolvers['deleteLearningGoal'] = async (
  _parent,
  { _id },
  { user }
) => {
  restrictAccess('admin', user, 'Must be logged in and an admin to delete a learning goal');
  const { deletedCount } = await deleteLearningGoal({ _id });
  if (!deletedCount) throw new NotFoundError('LearningGoal', _id, 'id');
  return { _id, success: true };
};
export const getLearningGoalByKeyResolver: APIQueryResolvers['getLearningGoalByKey'] = async (_, { key }, { user }) => {
  const learningGoal = await findLearningGoalIfAuthorized({ key }, user?._id);
  if (!learningGoal) throw new NotFoundError('LearningGoal', key, 'key');
  return learningGoal;
};

export const attachLearningGoalRequiresSubGoalResolver: APIMutationResolvers['attachLearningGoalRequiresSubGoal'] = async (
  _,
  { subGoalId, learningGoalId, payload },
  { user }
) => {
  if (!user) throw new UnauthenticatedError('Must be logged in');
  return await attachLearningGoalRequiresSubGoal(learningGoalId, subGoalId, {
    strength: payload.strength || 100,
  });
};
export const detachLearningGoalRequiresSubGoalResolver: APIMutationResolvers['detachLearningGoalRequiresSubGoal'] = async (
  _,
  { subGoalId, learningGoalId },
  { user }
) => {
  if (!user) throw new UnauthenticatedError('Must be logged in');
  return await detachLearningGoalRequiresSubGoal(learningGoalId, subGoalId);
};

export const startLearningGoalResolver: APIMutationResolvers['startLearningGoal'] = async (
  _,
  { learningGoalId },
  { user }
) => {
  if (!user) throw new UnauthenticatedError('Must be logged in');
  const { learningGoal, user: currentUser } = await startLearningGoal(user._id, learningGoalId);
  return { learningGoal, currentUser };
};

export const getLearningGoalDomainResolver: APILearningGoalResolvers['domain'] = async learningGoal => {
  const result = await getLearningGoalDomain(learningGoal._id);
  if (!result) return null;
  return {
    domain: result.domain,
    ...result.relationship,
    learningGoal: result.learningGoal,
  };
};

export const getLearningGoalRequiredSubGoalsResolver: APILearningGoalResolvers['requiredSubGoals'] = async learningGoal => {
  const results = await getLearningGoalRequiredSubGoals(learningGoal._id);
  return results.map(({ relationship, subGoal }) => ({
    subGoal,
    ...relationship,
  }));
};

export const getLearningGoalRequiredInGoalsResolver: APILearningGoalResolvers['requiredInGoals'] = async learningGoal => {
  const results = await getLearningGoalRequiredInGoals(learningGoal._id);
  return results.map(({ relationship, parentGoal }) => ({
    goal: parentGoal,
    ...relationship,
  }));
};

export const getLearningGoalCreatedByResolver: APILearningGoalResolvers['createdBy'] = async learningGoal => {
  return await getLearningGoalCreator(learningGoal._id);
};

export const getLearningGoalStartedResolver: APILearningGoalResolvers['started'] = async (
  learningGoal,
  _,
  { user }
) => {
  if (!user) return null;
  return await getUserStartedLearningGoal(user._id, learningGoal._id);
};

export const getLearningGoalStartedByResolver: APILearningGoalResolvers['startedBy'] = async (
  learningGoal,
  { options }
) => {
  return {
    count: await countLearningGoalStartedBy(learningGoal._id),
    items: (await getLearningGoalStartedBy(learningGoal._id, nullToUndefined(options))).map(
      ({ user, relationship }) => ({
        user,
        ...relationship,
      })
    ),
  };
};
