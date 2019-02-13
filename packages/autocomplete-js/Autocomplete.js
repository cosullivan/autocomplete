import AutocompleteCore from '../autocomplete/AutocompleteCore.js'
import uniqueId from '../autocomplete/util/uniqueId.js'
import '../style.css'

class Autocomplete {
  expanded = false
  loading = false
  position = {}
  resetPosition = true

  constructor(
    root,
    {
      search,
      onSubmit = () => {},
      baseClass = 'autocomplete',
      autoSelect,
      getResultValue = result => result,
      renderResults,
    } = {}
  ) {
    if (typeof root === 'string') {
      this.root = document.querySelector(root)
    } else {
      this.root = root
    }
    this.input = this.root.querySelector('input')
    this.results = this.root.querySelector('ul')
    this.baseClass = baseClass
    this.getResultValue = getResultValue
    this.renderResults = renderResults
    this.autocomplete = new AutocompleteCore({
      search,
      autoSelect,
      setValue: this.setValue,
      setAttribute: this.setAttribute,
      onUpdate: this.handleUpdate,
      onSubmit,
      onShow: this.handleShow,
      onHide: this.handleHide,
      onLoading: this.handleLoading,
      onLoaded: this.handleLoaded,
    })

    this.initialize()
  }

  // Set up aria attributes and events
  initialize = () => {
    this.input.setAttribute('role', 'combobox')
    this.input.setAttribute('autocomplete', 'off')
    this.input.setAttribute('autocapitalize', 'off')
    this.input.setAttribute('autocorrect', 'off')
    this.input.setAttribute('spellcheck', 'false')
    this.input.setAttribute('aria-autocomplete', 'list')
    this.input.setAttribute('aria-haspopup', 'listbox')
    this.input.setAttribute('aria-expanded', 'false')
    this.results.setAttribute('role', 'listbox')

    // Generate ID for results list if it doesn't have one
    if (!this.results.id) {
      this.results.id = uniqueId(`${this.baseClass}-results-`)
    }
    this.input.setAttribute('aria-owns', this.results.id)

    document.body.addEventListener('click', this.handleDocumentClick)
    this.input.addEventListener('input', this.autocomplete.handleInput)
    this.input.addEventListener('keydown', this.autocomplete.handleKeydown)
    this.results.addEventListener('click', this.autocomplete.handleResultClick)
    this.updateStyle()
  }

  setAttribute = (attribute, value) => {
    this.input.setAttribute(attribute, value)
  }

  setValue = result => {
    this.input.value = result ? this.getResultValue(result) : ''
  }

  handleUpdate = (results, selectedIndex) => {
    const resultProps = results.map((result, index) => {
      const isSelected = selectedIndex === index
      return `
        id='${this.baseClass}-result-${index}'
        class='${this.baseClass}-result'
        data-result-index='${index}'
        role='option'
        ${isSelected ? "aria-selected='true'" : ''}
      `
    })

    this.results.innerHTML =
      typeof this.renderResults === 'function'
        ? this.renderResults(results, resultProps)
        : results
            .map(
              (result, index) => `
                <li ${resultProps[index]}>
                  ${this.getResultValue(result)}
                </li>
              `
            )
            .join('')

    this.input.setAttribute(
      'aria-activedescendant',
      selectedIndex > -1 ? `${this.baseClass}-result-${selectedIndex}` : ''
    )

    if (this.resetPosition) {
      this.resetPosition = false
      this.position = this.autocomplete.getResultsPosition(
        this.input,
        this.results
      )
      this.updateStyle()
    }
  }

  handleShow = () => {
    this.expanded = true
    this.updateStyle()
  }

  handleHide = () => {
    this.expanded = false
    this.resetPosition = true
    this.updateStyle()
  }

  handleLoading = () => {
    this.loading = true
    this.updateStyle()
  }

  handleLoaded = () => {
    this.loading = false
    this.updateStyle()
  }

  handleDocumentClick = event => {
    if (this.root.contains(event.target)) {
      return
    }
    this.autocomplete.hideResults()
  }

  updateStyle = () => {
    this.root.dataset.expanded = this.expanded
    this.root.dataset.loading = this.loading
    this.root.dataset.position = this.position.bottom ? 'above' : 'below'

    this.results.style = `
      position: fixed;
      z-index: 1;
      visibility: ${this.expanded ? 'visible' : 'hidden'};
      pointer-events: ${this.expanded ? 'auto' : 'none'};
      ${
        this.position.top
          ? 'top: ' + this.position.top
          : 'bottom: ' + this.position.bottom
      };
      left: ${this.position.left};
      width: ${this.position.width};
    `
  }
}

export default Autocomplete
