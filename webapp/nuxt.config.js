const pkg = require('./package')
const envWhitelist = ['NODE_ENV', 'MAINTENANCE', 'MAPBOX_TOKEN']
const dev = process.env.NODE_ENV !== 'production'

const styleguidePath = '../Nitro-Styleguide'
const styleguideStyles = process.env.STYLEGUIDE_DEV
  ? [
      `${styleguidePath}/src/system/styles/main.scss`,
      `${styleguidePath}/src/system/styles/shared.scss`,
    ]
  : '@human-connection/styleguide/dist/shared.scss'

const buildDir = process.env.NUXT_BUILD || '.nuxt'

module.exports = {
  buildDir,
  mode: 'universal',

  dev: dev,
  debug: dev ? 'nuxt:*,app' : null,

  modern: !dev ? 'server' : false,

  pageTransition: {
    name: 'slide-up',
    mode: 'out-in',
  },

  env: {
    // pages which do NOT require a login
    publicPages: [
      'login',
      'logout',
      'password-reset-request',
      'password-reset-verify-code',
      'password-reset-change-password',
      // 'registration-signup', TODO: uncomment to open public registration
      'registration-signup-by-invitation-code',
      'registration-verify-code',
      'registration-create-user-account',
      'pages-slug',
      'imprint',
      'terms-and-conditions',
      'code-of-conduct',
      'data-privacy',
      'changelog',
    ],
    // pages to keep alive
    keepAlivePages: ['index'],
    // active locales
    locales: require('./locales'),
  },
  /*
   ** Headers of the page
   */
  head: {
    title: 'Human Connection',
    titleTemplate: '%s - Human Connection',
    meta: [
      {
        charset: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        hid: 'description',
        name: 'description',
        content: pkg.description,
      },
    ],
    link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
    ],
  },

  /*
   ** Customize the progress-bar color
   */
  loading: {
    color: '#86b31e',
    height: '2px',
    duration: 20000,
  },

  /*
   ** Global CSS
   */
  css: ['~assets/styles/main.scss'],

  /*
   ** Global processed styles
   */
  styleResources: {
    scss: styleguideStyles,
  },

  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    {
      src: `~/plugins/styleguide${process.env.STYLEGUIDE_DEV ? '-dev' : ''}.js`,
      ssr: true,
    },
    { src: '~/plugins/i18n.js', ssr: true },
    { src: '~/plugins/axios.js', ssr: false },
    { src: '~/plugins/keep-alive.js', ssr: false },
    { src: '~/plugins/vue-directives.js', ssr: false },
    { src: '~/plugins/v-tooltip.js', ssr: false },
    { src: '~/plugins/izi-toast.js', ssr: false },
    { src: '~/plugins/vue-filters.js' },
    { src: '~/plugins/vue-sweetalert-icons.js' },
  ],

  router: {
    middleware: ['authenticated'],
    linkActiveClass: 'router-link-active',
    linkExactActiveClass: 'router-link-exact-active',
    scrollBehavior: (to, _from, savedPosition) => {
      let position = false
      // Wolle: console.log('to: ', to)
      // if no children detected and scrollToTop is not explicitly disabled
      if (
        to.matched.length < 2 &&
        to.matched.every(r => r.components.default.options.scrollToTop !== false)
      ) {
        // scroll to the top of the page
        // Wolle: console.log('to.matched.length --- scrolling to top')
        position = {
          x: 0,
          y: 0,
        }
      } else if (to.matched.some(r => r.components.default.options.scrollToTop)) {
        // if one of the children has scrollToTop option set to true
        // Wolle: console.log('to.match.some ---- scrolling to top')
        position = {
          x: 0,
          y: 0,
        }
      }

      // savedPosition is only available for popstate navigations (back button)
      if (savedPosition) {
        // Wolle: console.log('savedPosition', savedPosition)
        position = savedPosition
      }

      return new Promise(resolve => {
        // wait for the out transition to complete (if necessary)
        // Wolle: console.log('resolve', resolve)
        window.$nuxt.$once('triggerScroll', () => {
          let processInterval = null
          let processTime = 0

          // coords will be used if no selector is provided,
          // or if the selector didn't match any element.
          // Wolle: console.log('inside window.$nuxt.$once')
          if (to.hash) {
            let hash = to.hash
            // Wolle: console.log('hash', hash)
            // CSS.escape() is not supported with IE and Edge.
            if (typeof window.CSS !== 'undefined' && typeof window.CSS.escape !== 'undefined') {
              // Wolle: console.log('window.CSS', window.CSS)
              hash = '#' + window.CSS.escape(hash.substr(1))
              // Wolle: console.log('hash after: ', hash)
            }
            try {
              // Wolle: console.log('document', document)
              // Wolle: console.log('document.querySelector(#comments)', document.querySelector('#comments'))
              // Wolle: console.log('why wont you work?', document.querySelector(hash))

              // Wolle: console.log('after sleep()')

              processInterval = setInterval(() => {
                // Wolle: console.log('process tick !!!')
                const queryIs = document.querySelector(hash)

                if (queryIs) {
                  position = {
                    selector: hash,
                  }
                  // Wolle: console.log('found hash position: ', position)
                }
                processTime += 100
                if (queryIs || processTime >= 2000) {
                  // Wolle: console.log('clearInterval of process !!!')
                  clearInterval(processInterval)
                  processInterval = null
                }
              }, 100)

              // Wolle: if (document.querySelector(hash)) {
              //   // scroll to anchor by returning the selector
              //   console.log('document.querySelector(hash)', document.querySelector(hash))
              //   position = {
              //     selector: hash,
              //   }
              // }
            } catch (e) {
              /* eslint-disable-next-line no-console */
              console.warn(
                'Failed to save scroll position. Please add CSS.escape() polyfill (https://github.com/mathiasbynens/CSS.escape).',
              )
            }
          }

          let resolveInterval = setInterval(() => {
            // Wolle: console.log('resolve tick !!!')
            if (!processInterval) {
              clearInterval(resolveInterval)
              // Wolle: console.log('position', position)
              resolve(position)
            }
          }, 100)
          // Wolle: console.log('position', position)
          // resolve(position)
        })
      })
    },
  },

  /*
   ** Nuxt.js modules
   */
  modules: [
    [
      '@nuxtjs/dotenv',
      {
        only: envWhitelist,
      },
    ],
    [
      'nuxt-env',
      {
        keys: envWhitelist,
      },
    ],
    'cookie-universal-nuxt',
    '@nuxtjs/apollo',
    '@nuxtjs/axios',
    '@nuxtjs/style-resources',
  ],

  /*
   ** Axios module configuration
   */
  axios: {
    // See https://github.com/nuxt-community/axios-module#options
    debug: dev,
    proxy: true,
  },
  proxy: {
    '/.well-known/webfinger': {
      target: process.env.GRAPHQL_URI || 'http://localhost:4000',
      toProxy: true, // cloudflare needs that
      headers: {
        Accept: 'application/json',
        'X-UI-Request': true,
        'X-API-TOKEN': process.env.BACKEND_TOKEN || 'NULL',
      },
    },
    '/activitypub': {
      // make this configurable (nuxt-dotenv)
      target: process.env.GRAPHQL_URI || 'http://localhost:4000',
      toProxy: true, // cloudflare needs that
      headers: {
        Accept: 'application/json',
        'X-UI-Request': true,
        'X-API-TOKEN': process.env.BACKEND_TOKEN || 'NULL',
      },
    },
    '/api': {
      // make this configurable (nuxt-dotenv)
      target: process.env.GRAPHQL_URI || 'http://localhost:4000',
      pathRewrite: {
        '^/api': '',
      },
      toProxy: true, // cloudflare needs that
      headers: {
        Accept: 'application/json',
        'X-UI-Request': true,
        'X-API-TOKEN': process.env.BACKEND_TOKEN || 'NULL',
      },
    },
  },

  // Give apollo module options
  apollo: {
    tokenName: 'human-connection-token', // optional, default: apollo-token
    cookieAttributes: {
      expires: 3, // optional, default: 7 (days)
    },
    // includeNodeModules: true, // optional, default: false (this includes graphql-tag for node_modules folder)

    // Watch loading state for all queries
    // See 'Smart Query > options > watchLoading' for detail
    // TODO: find a way to get this working
    // watchLoading(isLoading) {
    //   console.log('Global loading', countModifier)
    //   this.$nuxt.$loading.start()
    // },
    // required
    clientConfigs: {
      default: '~/plugins/apollo-config.js',
    },
  },

  manifest: {
    name: 'Human-Connection.org',
    description: 'Human-Connection.org',
    theme_color: '#ffffff',
    lang: 'de',
  },

  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      if (process.env.STYLEGUIDE_DEV) {
        const path = require('path')
        config.resolve.alias['@@'] = path.resolve(__dirname, `${styleguidePath}/src/system`)
        config.module.rules.push({
          resourceQuery: /blockType=docs/,
          loader: require.resolve(`${styleguidePath}/src/loader/docs-trim-loader.js`),
        })
      }

      const svgRule = config.module.rules.find(rule => rule.test.test('.svg'))
      svgRule.test = /\.(png|jpe?g|gif|webp)$/
      config.module.rules.push({
        test: /\.svg$/,
        loader: 'vue-svg-loader',
        options: {
          svgo: {
            plugins: [
              {
                removeViewBox: false,
              },
              {
                removeDimensions: true,
              },
            ],
          },
        },
      })
    },
  },
}
