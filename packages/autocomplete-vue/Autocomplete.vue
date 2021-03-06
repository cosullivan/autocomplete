<template>
  <div ref="root">
    <slot
      :rootProps="rootProps"
      :inputProps="inputProps"
      :inputListeners="inputListeners"
      :resultListProps="resultListProps"
      :resultListListeners="resultListListeners"
      :results="results"
      :resultProps="resultProps"
    >
      <div v-bind="rootProps">
        <input
          v-bind="inputProps"
          @input="handleInput"
          @keydown="core.handleKeyDown"
          @focus="core.handleFocus"
          @blur="core.handleBlur"
          v-on="$listeners"
        />
        <ul
          v-bind="resultListProps"
          v-on="resultListListeners"
        >
          <template v-for="(result, index) in results">
            <slot name="result" :result="result" :props="resultProps[index]">
              <li :key="resultProps[index].id" v-bind="resultProps[index]">
                {{ getResultValue(result) }}
              </li>
            </slot>
          </template>
        </ul>
      </div>
    </slot>
  </div>
</template>

<script>
import AutocompleteCore from '../autocomplete/AutocompleteCore.js'
import uniqueId from '../autocomplete/util/uniqueId.js'
import getRelativePosition from '../autocomplete/util/getRelativePosition.js'
import debounce from '../autocomplete/util/debounce.js'

export default {
  name: 'Autocomplete',
  inheritAttrs: false,

  props: {
    search: {
      type: Function,
      required: true,
    },
    baseClass: {
      type: String,
      default: 'autocomplete',
    },
    autoSelect: {
      type: Boolean,
      default: false,
    },
    getResultValue: {
      type: Function,
      default: result => result,
    },
    defaultValue: {
      type: String,
      default: '',
    },
    debounceTime: {
      type: Number,
      default: 0,
    },
  },

  data() {
    const core = new AutocompleteCore({
      search: this.search,
      autoSelect: this.autoSelect,
      setValue: this.setValue,
      onUpdate: this.handleUpdate,
      onSubmit: this.handleSubmit,
      onShow: this.handleShow,
      onHide: this.handleHide,
      onLoading: this.handleLoading,
      onLoaded: this.handleLoaded,
    })
    if (this.debounceTime > 0) {
      core.handleInput = debounce(core.handleInput, this.debounceTime)
    }

    return {
      core,
      value: this.defaultValue,
      inputId: uniqueId(`${this.baseClass}-input-`),
      resultListId: uniqueId(`${this.baseClass}-result-list-`),
      results: [],
      selectedIndex: -1,
      expanded: false,
      loading: false,
      position: 'below',
      resetPosition: true,
    }
  },

  computed: {
    rootProps() {
      return {
        class: this.baseClass,
        style: { position: 'relative' },
        'data-expanded': this.expanded,
        'data-loading': this.loading,
        'data-position': this.position,
      }
    },
    inputProps() {
      return {
        id: this.inputId,
        class: `${this.baseClass}-input`,
        value: this.value,
        role: 'combobox',
        autocomplete: 'off',
        autocapitalize: 'off',
        autocorrect: 'off',
        spellcheck: 'false',
        'aria-autocomplete': 'list',
        'aria-haspopup': 'listbox',
        'aria-owns': this.resultListId,
        'aria-expanded': this.expanded ? 'true' : 'false',
        'aria-activedescendant':
          this.selectedIndex > -1
            ? this.resultProps[this.selectedIndex].id
            : '',
        ...this.$attrs,
      }
    },
    inputListeners() {
      return {
        input: this.handleInput,
        keydown: this.core.handleKeyDown,
        focus: this.core.handleFocus,
        blur: this.core.handleBlur,
      }
    },
    resultListProps() {
      const yPosition = this.position === 'below' ? 'top' : 'bottom'
      return {
        id: this.resultListId,
        class: `${this.baseClass}-result-list`,
        role: 'listbox',
        style: {
          position: 'absolute',
          zIndex: 1,
          width: '100%',
          visibility: this.expanded ? 'visible' : 'hidden',
          pointerEvents: this.expanded ? 'auto' : 'none',
          [yPosition]: '100%',
        },
      }
    },
    resultListListeners() {
      return {
        mousedown: this.core.handleResultMouseDown,
        click: this.core.handleResultClick,
      }
    },
    resultProps() {
      return this.results.map((result, index) => ({
        id: `${this.baseClass}-result-${index}`,
        class: `${this.baseClass}-result`,
        'data-result-index': index,
        role: 'option',
        ...(this.selectedIndex === index ? { 'aria-selected': 'true' } : {}),
      }))
    },
  },

  mounted() {
    document.body.addEventListener('click', this.handleDocumentClick)
    this.inputElement = document.getElementById(this.inputId)
    this.resultListElement = document.getElementById(this.resultListId)
  },

  beforeDestroy() {
    document.body.removeEventListener('click', this.handleDocumentClick)
    this.inputElement = null;
    this.resultListElement = null;
  },

  updated() {
    if (!this.inputElement || !this.resultListElement) {
      return
    }
    if (this.resetPosition && this.results.length > 0) {
      this.resetPosition = false
      this.position = getRelativePosition(
        this.inputElement,
        this.resultListElement
      )
    }
    this.core.checkSelectedResultVisible(this.resultListElement)
  },

  methods: {
    setValue(result) {
      this.value = result ? this.getResultValue(result) : ''
    },

    handleUpdate(results, selectedIndex) {
      this.results = results
      this.selectedIndex = selectedIndex
      this.$emit('update', results, selectedIndex)
    },

    handleShow() {
      this.expanded = true
    },

    handleHide() {
      this.expanded = false
      this.resetPosition = true
    },

    handleLoading() {
      this.loading = true
    },

    handleLoaded() {
      this.loading = false
    },

    handleInput(event) {
      this.value = event.target.value
      this.core.handleInput(event)
    },

    handleSubmit(selectedResult) {
      this.$emit('submit', selectedResult)
    },

    handleDocumentClick(event) {
      if (this.$refs.root.contains(event.target)) {
        return
      }
      this.core.hideResults()
    },
  },
}
</script>
