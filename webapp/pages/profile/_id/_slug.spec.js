import { config, mount, shallowMount, createLocalVue } from '@vue/test-utils'
import ProfileSlug from './_slug.vue'
import Vuex from 'vuex'
import Styleguide from '@human-connection/styleguide'

const localVue = createLocalVue()

localVue.use(Vuex)
localVue.use(Styleguide)
localVue.filter('date', d => d)

config.stubs['no-ssr'] = '<span><slot /></span>'
config.stubs['v-popover'] = '<span><slot /></span>'
config.stubs['nuxt-link'] = '<span><slot /></span>'

describe('ProfileSlug', () => {
  let wrapper
  let Wrapper
  let mocks

  beforeEach(() => {
    mocks = {
      post: {
        id: 'p23',
        name: 'It is a post',
      },
      $t: jest.fn(t => t),
      // If you mocking router, than don't use VueRouter with localVue: https://vue-test-utils.vuejs.org/guides/using-with-vue-router.html
      $route: {
        params: {
          id: '4711',
          slug: 'john-doe',
        },
      },
      $router: {
        history: {
          push: jest.fn(),
        },
      },
      $toast: {
        success: jest.fn(),
        error: jest.fn(),
      },
      $apollo: {
        loading: false,
        mutate: jest.fn().mockResolvedValue(),
      },
    }
  })

  describe('shallowMount', () => {
    Wrapper = () => {
      return shallowMount(ProfileSlug, {
        mocks,
        localVue,
      })
    }

    beforeEach(jest.useFakeTimers)

    describe('test mixin "PostMutationHelpers"', () => {
      beforeEach(() => {
        wrapper = Wrapper()
      })

      describe('deletion of Post from List by invoking "deletePostCallback(`list`)"', () => {
        beforeEach(() => {
          wrapper.vm.deletePostCallback('list')
        })

        describe('after timeout', () => {
          beforeEach(jest.runAllTimers)

          it('emits "deletePost"', () => {
            expect(wrapper.emitted().deletePost).toHaveLength(1)
          })

          it('does not go to index (main) page', () => {
            expect(mocks.$router.history.push).not.toHaveBeenCalled()
          })

          it('does call mutation', () => {
            expect(mocks.$apollo.mutate).toHaveBeenCalledTimes(1)
          })

          it('mutation is successful', () => {
            expect(mocks.$toast.success).toHaveBeenCalledTimes(1)
          })
        })
      })
    })
  })
  describe('mount', () => {
    Wrapper = () => {
      return mount(ProfileSlug, {
        mocks,
        localVue,
      })
    }

    describe('given an authenticated user', () => {
      beforeEach(() => {
        mocks.$filters = {
          removeLinks: c => c,
        }
        mocks.$store = {
          getters: {
            'auth/user': {
              id: 'u23',
            },
          },
        }
      })

      describe('given a user for the profile', () => {
        beforeEach(() => {
          wrapper = Wrapper()
          wrapper.setData({
            User: [
              {
                id: 'u3',
                name: 'Bob the builder',
                contributionsCount: 6,
                shoutedCount: 7,
                commentedCount: 8,
              },
            ],
          })
        })

        it('displays name of the user', () => {
          expect(wrapper.text()).toContain('Bob the builder')
        })

        describe('load more button', () => {
          const aPost = {
            title: 'I am a post',
            content: 'This is my content',
            contentExcerpt: 'This is my content',
          }

          describe('currently no posts available (e.g. after tab switching)', () => {
            beforeEach(() => {
              wrapper.setData({
                Post: null,
              })
            })

            it('displays no "load more" button', () => {
              expect(wrapper.find('.load-more').exists()).toBe(false)
            })

            describe('apollo client in `loading` state', () => {
              beforeEach(() => {
                wrapper.vm.$apollo.loading = true
              })

              it('never displays more than one loading spinner', () => {
                expect(wrapper.findAll('.ds-spinner')).toHaveLength(1)
              })

              it('displays a loading spinner below the posts list', () => {
                expect(wrapper.find('.user-profile-posts-list .ds-spinner').exists()).toBe(true)
              })
            })
          })

          describe('pagination returned less posts than available', () => {
            beforeEach(() => {
              const posts = [1, 2, 3, 4, 5].map(id => {
                return { ...aPost, id }
              })

              wrapper.setData({
                Post: posts,
              })
            })

            it('displays a "load more" button', () => {
              expect(wrapper.find('.load-more').exists()).toBe(true)
            })

            describe('apollo client in `loading` state', () => {
              beforeEach(() => {
                wrapper.vm.$apollo.loading = true
              })

              it('never displays more than one loading spinner', () => {
                expect(wrapper.findAll('.ds-spinner')).toHaveLength(1)
              })

              it('displays a loading spinner below the posts list', () => {
                expect(wrapper.find('.load-more .ds-spinner').exists()).toBe(true)
              })
            })
          })

          describe('pagination returned as many posts as available', () => {
            beforeEach(() => {
              const posts = [1, 2, 3, 4, 5, 6].map(id => {
                return { ...aPost, id }
              })

              wrapper.setData({
                Post: posts,
              })
            })

            it('displays no "load more" button', () => {
              expect(wrapper.find('.load-more').exists()).toBe(false)
            })
          })
        })
      })
    })
  })
})
