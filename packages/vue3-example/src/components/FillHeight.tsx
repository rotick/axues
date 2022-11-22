import { ref, onMounted, nextTick, defineComponent } from 'vue'
export default defineComponent({
  props: {
    minHeight: {
      type: Number,
      default: 300
    },
    distanceFromBottom: {
      type: Number,
      default: 0
    }
  },
  setup (props, { slots }) {
    const el = ref<HTMLElement | null>(null)
    const top = ref(0)
    function computeHeight () {
      top.value = el.value?.getBoundingClientRect().top || 0
    }
    onMounted(() => {
      nextTick(computeHeight)
    })

    return () => (
      <div
        ref={el}
        style={{
          minHeight: `${props.minHeight}px`,
          height: `calc(100vh - ${top.value}px - ${props.distanceFromBottom}px)`
        }}
      >
        {slots.default ? slots.default() : null}
      </div>
    )
  }
})
