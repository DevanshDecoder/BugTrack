import Activity from '../models/Activity.js';

export const recordActivity = async ({
  issueId,
  projectId,
  actorId,
  action,
  field = '',
  oldValue = '',
  newValue = '',
  details = '',
}) => {
  try {
    await Activity.create({
      issue: issueId,
      project: projectId,
      actor: actorId,
      action,
      field,
      oldValue,
      newValue,
      details,
    });
  } catch (error) {
    console.error('[Activity Logger Error]', error.message);
  }
};
