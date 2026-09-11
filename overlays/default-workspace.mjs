/**
 * Register the container workspace mount as a DSH project.
 * create() is idempotent: the same canonical path returns the existing record.
 */
export const name = 'default-workspace'
export const inject = ['workspaceRegistry']

export async function apply(ctx) {
  await ctx.workspaceRegistry.create('/workspace')
}
