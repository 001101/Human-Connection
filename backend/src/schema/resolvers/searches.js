import posts from './posts.js'
import users from './users.js'

const postArgs = (args, query) => {
    args.query = query.replace(/\s/g, '~ ') + '~'
    args.filter = {}
    return args
}

const userArgs = (args, query) => {
    args.query = new RegExp('(?i).*BOB.*')//(?i).*' + query + '.*
    args.filter = {}
    return args
}

export default {
    Query: {
	findAnything: async (_parent, args, context, _resolveInfo) => {
	    const query = args.query
	    console.log('postArgs', postArgs(args, query))
	    const postResults = await posts.Query.findPosts(_parent, postArgs(args, query), context, _resolveInfo)
	    console.log('Posts', postResults)
    	    //console.log('userArgs', userArgs(args, query))
	    //const userResults = await users.Query.findUsers(_parent, userArgs(args, query), context, _resolveInfo)
	    //console.log('Users', userResults)
	    return true
	}
    }
}

