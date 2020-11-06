import { NotFoundError } from "../../errors/NotFoundError";
import { getLearningMaterialRating } from "../../repositories/learning_materials.repository";
import { attachResourceToLearningPath, detachResourceFromLearningPath, findLearningPathCreatedBy, getLearningPathComplementaryResources, getLearningPathResourceItems } from "../../repositories/learning_paths.repository";
import { createFullLearningPath, deleteFullLearningPath, updateFullLearningPath } from "../../services/learning_paths.service";
import { UnauthenticatedError } from "../errors/UnauthenticatedError";
import { APILearningPathResolvers, APIMutationResolvers, APIQueryResolvers } from "../schema/types";
import { nullToUndefined } from "../util/nullToUndefined";

export const createLearningPathResolver: APIMutationResolvers['createLearningPath'] = async (_ctx, { payload }, { user }) => {
    if (!user) throw new UnauthenticatedError(`Must be logged in to create a learning path`)
    return createFullLearningPath(user._id, nullToUndefined(payload))
}

export const updateLearningPathResolver: APIMutationResolvers['updateLearningPath'] = async (_ctx, { _id, payload }, { user }) => {
    if (!user) throw new UnauthenticatedError('Must be logged in')

    const learningPath = await findLearningPathCreatedBy(user._id, { _id })
    if (!learningPath) throw new NotFoundError('LearningPath', _id)

    return await updateFullLearningPath(_id, nullToUndefined(payload))
}

export const deleteLearningPathResolver: APIMutationResolvers['deleteLearningPath'] = async (_ctx, { _id }, { user }) => {
    if (!user) throw new UnauthenticatedError('Must be logged in')

    const learningPath = await findLearningPathCreatedBy(user._id, { _id })
    if (!learningPath) throw new NotFoundError('LearningPath', _id)

    await deleteFullLearningPath(_id)
    return {
        success: true,
        _id: learningPath._id
    }
}

export const getLearningPathResolver: APIQueryResolvers['getLearningPath'] = async (_ctx, { _id }, { user }) => {
    if (!user) throw new UnauthenticatedError('Must be logged in')

    const learningPath = await findLearningPathCreatedBy(user._id, { _id })
    if (!learningPath) throw new NotFoundError('LearningPath', _id)
    return learningPath
}

export const getLearningPathByKeyResolver: APIQueryResolvers['getLearningPathByKey'] = async (_ctx, { key }, { user }) => {
    if (!user) throw new UnauthenticatedError('Must be logged in')

    const learningPath = await findLearningPathCreatedBy(user._id, { key })
    if (!learningPath) throw new NotFoundError('LearningPath', key, 'key')
    return learningPath
}

export const addComplementaryResourceToLearningPathResolver: APIMutationResolvers['addComplementaryResourceToLearningPath'] = async (_ctx, { learningPathId, resourceId }, { user }) => {
    if (!user) throw new UnauthenticatedError('Must be logged in')

    const learningPath = await findLearningPathCreatedBy(user._id, { _id: learningPathId })
    if (!learningPath) throw new NotFoundError('LearningPath', learningPathId)

    return await attachResourceToLearningPath(learningPathId, resourceId)
}
export const removeComplementaryResourceFromLearningPathResolver: APIMutationResolvers['removeComplementaryResourceFromLearningPath'] = async (_ctx, { learningPathId, resourceId }, { user }) => {
    if (!user) throw new UnauthenticatedError('Must be logged in')

    const learningPath = await findLearningPathCreatedBy(user._id, { _id: learningPathId })
    if (!learningPath) throw new NotFoundError('LearningPath', learningPathId)

    return await detachResourceFromLearningPath(learningPathId, resourceId)
}


export const getLearningPathResourceItemsResolver: APILearningPathResolvers['resourceItems'] = async (learningPath) => {
    return await getLearningPathResourceItems(learningPath._id)
}

export const getLearningPathComplementaryResourcesResolver: APILearningPathResolvers['complementaryResources'] = async (learningPath) => {
    return await getLearningPathComplementaryResources(learningPath._id)
}

export const getLearningPathRatingResolver: APILearningPathResolvers['rating'] = (learningPath) => getLearningMaterialRating(learningPath._id)