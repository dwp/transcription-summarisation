//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Add JavaScript here
})
// For guidance on how to add JavaScript see:

// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images

//

window.GOVUKPrototypeKit.documentReady(() => {

  // Read the current answer of a choice field, whether displayed or being edited

  const getChoiceValue = (field) => {

    const radio = field.querySelector('.dwp-field__editor input:checked')

    if (radio) return radio.value

    const value = field.querySelector('.dwp-field__value')

    return value ? value.innerText.trim() : null

  }

  // Show or hide any fields that depend on a choice answer (e.g. Anxiety and

  // depression only shows when "Is this a mental health condition?" is Yes)

  const applyConditionals = (group) => {

    group.querySelectorAll('[data-controls]').forEach((control) => {

      const target = group.querySelector('#' + control.dataset.controls)

      if (!target) return

      const showWhen = target.dataset.showWhen || 'Yes'

      target.hidden = getChoiceValue(control) !== showWhen

    })

  }

  // Turn a single field into its editor (radios for a choice, otherwise a textarea)

  const openField = (field, group) => {

    const value = field.querySelector('.dwp-field__value')

    if (!value || field.querySelector('.dwp-field__editor')) return

    const text = value.querySelector('.dwp-muted') ? '' : value.innerText.trim()

    if (field.dataset.fieldType === 'choice') {

      const options = (field.dataset.fieldOptions || 'Yes,No').split(',')

      const name = 'choice-' + Math.random().toString(36).slice(2)

      const radios = document.createElement('div')

      radios.className = 'govuk-radios govuk-radios--inline dwp-field__editor'

      radios.innerHTML = options.map((raw, i) => {

        const opt = raw.trim()

        const id = name + '-' + i

        const checked = opt === text ? ' checked' : ''

        return '<div class="govuk-radios__item">' +

          '<input class="govuk-radios__input" id="' + id + '" name="' + name + '" type="radio" value="' + opt + '"' + checked + '>' +

          '<label class="govuk-label govuk-radios__label" for="' + id + '">' + opt + '</label>' +

          '</div>'

      }).join('')

      value.hidden = true

      value.after(radios)

      if (field.dataset.controls) {

        radios.querySelectorAll('input').forEach((input) => {

          input.addEventListener('change', () => applyConditionals(group))

        })

      }

    } else {

      const textarea = document.createElement('textarea')

      textarea.className = 'govuk-textarea dwp-field__editor'

      textarea.rows = Math.min(8, Math.max(2, Math.round(text.length / 80) + 1))

      textarea.value = text

      value.hidden = true

      value.after(textarea)

    }

  }

  // Commit or discard a field's editor. Empty values show a muted placeholder

  // rather than an empty line.

  const closeField = (field, save) => {

    const value = field.querySelector('.dwp-field__value')

    const editor = field.querySelector('.dwp-field__editor')

    if (editor) {

      if (save && value) {

        let text

        if (field.dataset.fieldType === 'choice') {

          const chosen = editor.querySelector('input:checked')

          text = chosen ? chosen.value : ''

        } else {

          text = editor.value.trim()

        }

        if (text === '') {

          value.innerHTML = '<span class="dwp-muted">Not added</span>'

        } else {

          value.textContent = text

        }

      }

      editor.remove()

    }

    if (value) value.hidden = false

  }

  // Build a blank text field (used when adding a new medication)

  const makeTextField = (label) => {

    const field = document.createElement('div')

    field.className = 'dwp-field'

    const heading = document.createElement('h3')

    heading.className = 'govuk-heading-s'

    heading.textContent = label

    const value = document.createElement('p')

    value.className = 'govuk-body dwp-field__value'

    value.innerHTML = '<span class="dwp-muted">Not added</span>'

    field.appendChild(heading)

    field.appendChild(value)

    return field

  }

  // Append a new medication block (already in edit mode) to a group's list

  const addMedication = (group) => {

    const list = group.querySelector('.dwp-medication-list')

    if (!list) return null

    const block = document.createElement('div')

    block.className = 'dwp-medication'

    const title = document.createElement('h3')

    title.className = 'govuk-heading-s dwp-medication__title'

    title.textContent = 'Additional medication'

    block.appendChild(title)

    ;['Medication name', 'Dosage and frequency', 'Reason for taking', 'How effective is the medication?', 'Additional notes (optional)'].forEach((label) => {

      const field = makeTextField(label)

      block.appendChild(field)

      openField(field, group)

    })

    list.appendChild(block)

    const firstEditor = block.querySelector('.dwp-field__editor')

    if (firstEditor) firstEditor.focus()

    return block

  }

  // "View in transcription": switch to the Transcript tab, scroll to the

  // matching turn and briefly highlight it.

  document.querySelectorAll('.dwp-view-transcript').forEach((link) => {

    link.addEventListener('click', (e) => {

      e.preventDefault()

      const target = document.getElementById(link.dataset.target)

      // Activate the Transcript tab (GOV.UK tabs shows the matching panel)

      const transcriptTab = document.querySelector('.govuk-tabs__tab[href="#transcript"]')

      if (transcriptTab) transcriptTab.click()

      if (!target) return

      // Wait a tick so the panel is visible before scrolling/highlighting

      window.setTimeout(() => {

        document.querySelectorAll('.dwp-transcript__turn--highlight').forEach((t) => {

          t.classList.remove('dwp-transcript__turn--highlight')

        })

        target.classList.add('dwp-transcript__turn--highlight')

        target.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Fade the highlight out after a few seconds

        window.setTimeout(() => {

          target.classList.remove('dwp-transcript__turn--highlight')

        }, 4000)

      }, 50)

    })

  })

  // Inline editing: a whole section (e.g. Condition history) is one editable

  // component. Clicking Edit turns every field into an editor, with a single

  // Save/Cancel bar for the section.

  document.querySelectorAll('[data-editable-group]').forEach((group) => {

    const editLink = group.querySelector('.dwp-group-edit')

    const readActions = group.querySelector('.dwp-group-actions')

    // Apply conditional visibility on page load

    applyConditionals(group)

    if (!editLink) return

    editLink.addEventListener('click', (e) => {

      e.preventDefault()

      group.querySelectorAll('.dwp-field').forEach((field) => openField(field, group))

      applyConditionals(group)

      editLink.hidden = true

      if (readActions) readActions.hidden = true

      // Optional "Add another..." control for groups that allow it

      const addedBlocks = []

      let addBtn = null

      if (group.dataset.canAdd) {

        addBtn = document.createElement('button')

        addBtn.type = 'button'

        addBtn.className = 'govuk-button govuk-button--secondary dwp-add-btn'

        addBtn.textContent = group.dataset.addLabel || 'Add another'

        const list = group.querySelector('.dwp-medication-list')

        if (list) list.after(addBtn)

        else group.appendChild(addBtn)

        addBtn.addEventListener('click', (ev) => {

          ev.preventDefault()

          const block = addMedication(group)

          if (block) addedBlocks.push(block)

        })

      }

      const bar = document.createElement('div')

      bar.className = 'govuk-button-group dwp-group-editbar'

      bar.innerHTML =

        '<button class="govuk-button dwp-group-save" data-module="govuk-button">Save changes</button>' +

        '<a class="govuk-link dwp-group-cancel" href="#">Cancel</a>'

      group.appendChild(bar)

      const firstEditor = group.querySelector('.dwp-field__editor')

      if (firstEditor) firstEditor.focus()

      const exit = (save) => {

        if (!save) addedBlocks.forEach((block) => block.remove())

        group.querySelectorAll('.dwp-field').forEach((field) => closeField(field, save))

        if (addBtn) addBtn.remove()

        bar.remove()

        editLink.hidden = false

        if (readActions) readActions.hidden = false

        applyConditionals(group)

      }

      bar.querySelector('.dwp-group-save').addEventListener('click', (ev) => {

        ev.preventDefault()

        exit(true)

      })

      bar.querySelector('.dwp-group-cancel').addEventListener('click', (ev) => {

        ev.preventDefault()

        exit(false)

      })

    })

  })

})

