const normalize = (args) => {
  if (typeof args.deleted !== 'boolean') {
    args.deleted = false
  }
  if (typeof args.disabled !== 'boolean') {
    args.disabled = false
  }
  return args
}

export default {
  Query: {
    Post: (resolve, root, args, context, info) => {
      return resolve(root, normalize(args), context, info)
    },
    Comment: async (resolve, root, args, context, info) => {
      return resolve(root, normalize(args), context, info)
    },
    User: async (resolve, root, args, context, info) => {
      return resolve(root, normalize(args), context, info)
    }
  }
}
