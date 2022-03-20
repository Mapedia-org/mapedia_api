import { Comment } from '../../entities/Comment';
import { NotFoundError } from '../../errors/NotFoundError';
import { createComment, findCommentById, getCommentChildren } from '../../repositories/comments.repository';
import { findUser } from '../../repositories/users.repository';
import { UnauthenticatedError } from '../errors/UnauthenticatedError';
import { APIComment, APICommentResolvers, APIMutationResolvers, APIQueryResolvers } from '../schema/types';
import { nullToUndefined } from '../util/nullToUndefined';

export function toAPIComment(comment: Comment): APIComment {
  return {
    _id: comment._id,
    parentId: comment.parent_id,
    contentMarkdown: comment.content_markdown,
    discussionId: comment.discussion_id,
    postedAt: comment.created_at,
    postedByUserId: comment.author_id,
  };
}
export const getCommentByIdResolver: APIQueryResolvers['getCommentById'] = async (_, { commentId }) => {
  const comment = await findCommentById(commentId);
  if (!comment) throw new NotFoundError('Comment', commentId);
  return toAPIComment(comment);
};

export const postCommentResolver: APIMutationResolvers['postComment'] = async (_, { payload }, { user }) => {
  if (!user) throw new UnauthenticatedError('Must be logged in to post a comment');

  return toAPIComment(await createComment(nullToUndefined(payload), user._id));
};

export const getCommentParentResolver: APICommentResolvers['parent'] = async (comment, {}, { user }) => {
  if (!comment.parentId) return null;
  const parent = await findCommentById(comment.parentId);
  if (!parent)
    throw new Error(`parent not found while parentId is set, should not be possible: parentId: ${comment.parentId}`);
  return toAPIComment(parent);
};

export const getCommentChildrenResolver: APICommentResolvers['children'] = async (parent) => {
  const childrenComment = await getCommentChildren(parent._id);
  return childrenComment.map(toAPIComment);
};

export const getCommentPostedByResolver: APICommentResolvers['postedBy'] = async (parent) => {
  const author = await findUser({ _id: parent.postedByUserId });
  if (!author) throw new Error(`Comment ${parent._id} has no valid author (postedByUserId: ${parent.postedByUserId})`);
  return author;
};
