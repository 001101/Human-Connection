import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import Comment from './Comment.vue'
import Vue from 'vue'
import Vuex from 'vuex'
import Styleguide from '@human-connection/styleguide'

const localVue = createLocalVue()

localVue.use(Vuex)
localVue.use(Styleguide)


describe('Comment.vue', () => {
  let wrapper
  let Wrapper
  let propsData
  let mocks

  beforeEach(() => {
    propsData = {}
    mocks = {
      $t: jest.fn(),
    }
  })

  describe('shallowMount', () => {
    const Wrapper = () => {
      return shallowMount(Comment, { propsData, mocks, localVue })
    }

    describe('given a comment', () => {
      beforeEach(() => {
        propsData.comment = {
          content: 'Hello I am a comment content'
        }
      })

      it('renders content', () => {
        const wrapper = Wrapper()
        expect(wrapper.text()).toMatch('Hello I am a comment content')
      })
    })
  })
})
