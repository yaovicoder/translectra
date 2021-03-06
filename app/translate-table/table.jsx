import highlightJs from 'highlight.js'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import capitalizeFirstLetter from '../helpers/capitalizeFirstLetter'
import MarkdownField from '../data-table/markdown-field'

export default class Table extends React.PureComponent {
  constructor(props) {
    super(props)

    this.highlightedKeyLanguageIds = []

    this.state = {
      confirmRemovalForTranslationId: '',
      isDeleting: false,
      openedKeyLanguageId: '',
      rowWidth: '0',
    }
  }

  componentDidMount() {
    this.updateRowWidth()
    window.addEventListener('resize', this.updateRowWidth.bind(this))
  }

  UNSAFE_componentWillUpdate(nextProps) {
    this.highlightedKeyLanguageIds = this.highlightedKeyLanguageIds
      .filter(keyLanguageId => Boolean(nextProps.items.findIndex(({ _id }) => _id === keyLanguageId) + 1))
  }

  updateRowWidth() {
    this.setState({ rowWidth: `${document.querySelector('tr').clientWidth}px` })
  }

  highlightValue(keyLanguageId, $node) {
    if (!this.highlightedKeyLanguageIds.includes(keyLanguageId) && $node !== null) {
      this.highlightedKeyLanguageIds.push(keyLanguageId)
      highlightJs.highlightBlock($node)
    }
  }

  toggleTranslationForm(keyLanguageId) {
    this.setState({
      openedKeyLanguageId: this.state.openedKeyLanguageId === keyLanguageId ? '' : keyLanguageId,
    })
  }

  submit(event) {
    event.preventDefault()

    this.props.onSubmit(this.state.openedKeyLanguageId, this.$form.value.value)
  }

  remove(translationId) {
    if (this.props.isLoading) return

    this.setState({
      confirmRemovalForTranslationId: translationId,
      isDeleting: false,
    })
  }

  delete(translationId) {
    if (this.props.isLoading) return

    this.setState({ isDeleting: true })
    this.props.onDelete(translationId)
  }

  renderForm(keyLanguage) {
    const hasError = this.props.errors.value !== undefined

    return (
      <tr key={`${keyLanguage._id}-form`}>
        <td className='border-top-0 p-0' colSpan='6'>
          <form
            autoComplete='off'
            className='form mb-2'
            noValidate
            onSubmit={this.submit.bind(this)}
            ref={node => this.$form = node}
          >
            <div className='form-group'>
              <MarkdownField
                defaultValue=''
                hasError={hasError}
                isDisabled={this.props.isLoading}
                isText={!keyLanguage.key.isMarkdown}
                lang={keyLanguage.language.code}
                name='value'
              />
              <div
                children={hasError && this.props.errors.value.message}
                className='invalid-feedback'
                style={{ display: hasError && Boolean(this.props.errors.value) ? 'block' : 'none' }}
              />
            </div>
            <button
              children='Submit'
              className='btn btn-sm btn-primary'
              disabled={this.props.isLoading}
              type='submit'
            />
          </form>
        </td>
      </tr>
    )
  }

  renderTranslations(keyLanguage, translations) {
    const translationsWithScore = translations.map(translation => ({
      ...translation,
      score: translation.upVotes.length - translation.downVotes.length,
    }))

    const translationsWithScoreSorted = R.sortWith([
      R.descend(R.prop('isAccepted')),
      R.descend(R.prop('score')),
    ])(translationsWithScore)

    return (
      <tr key={`${keyLanguage._id}-translations`}>
        <td className='border-top-0 p-2' colSpan='6'>
          {translationsWithScoreSorted.map(translation => {
            const voteUpActionClass = translation.author._id !== this.props.userId
              ? translation.upVotes.includes(this.props.userId) ? 'translation__action-on' : 'translation__action-off'
              : 'translation__icon text-secondary'
            const voteDownActionClass = translation.author._id !== this.props.userId
              ? translation.downVotes.includes(this.props.userId) ? 'translation__action-on' : 'translation__action-off'
              : 'translation__icon text-secondary'
            const acceptActionClass = this.props.isManager
              ? translation.isAccepted ? 'translation__action-on' : 'translation__action-off'
              : translation.isAccepted ? 'translation__icon text-success' : 'translation__icon text-light'

            return (
              <div className='mb-3' key={translation._id}>
                <div className='d-flex justify-content-between bg-light border p-1'>
                  <div lang={keyLanguage.language.code}>{translation.value}</div>
                  <div className='d-flex flex-column align-items-center pr-0 no-select' style={{ minWidth: '2rem' }}>
                    <i
                      children='arrow_drop_up'
                      className={`material-icons ${voteUpActionClass}`}
                      onClick={() => translation.author._id !== this.props.userId
                        ? this.props.onVote(translation._id, 1)
                        : void 0
                      }
                    />
                    <div>{translation.score}</div>
                    <i
                      children='arrow_drop_down'
                      className={`material-icons ${voteDownActionClass}`}
                      onClick={() => translation.author._id !== this.props.userId
                        ? this.props.onVote(translation._id, -1)
                        : void 0
                      }
                    />
                    <i
                      children='check'
                      className={`material-icons ${acceptActionClass}`}
                      onClick={() => this.props.isManager
                        ? this.props.onAccept(keyLanguage._id, translation._id, !translation.isAccepted)
                        : void 0
                      }
                    />
                  </div>
                </div>
                <div className='mt-1 text-secondary d-flex justify-content-between' style={{ fontSize: '12px' }}>
                  <div className='no-select'>
                    {`${capitalizeFirstLetter(moment(translation.createdAt).fromNow())} by ${translation.author.name}.`}
                  </div>
                  <div>
                    {translation._id === this.state.confirmRemovalForTranslationId
                      ? this.state.isDeleting
                        ? 'Deleting...'
                        : (
                          <div>
                            {`Are your sure to delete ${translation.author._id === this.props.userId ? 'your' : 'this'} translation ?`}
                            <span
                              children='[YES]'
                              className='mx-3'
                              onClick={() => this.delete(translation._id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span
                              children='[NO]'
                              className='mx-3'
                              onClick={() => this.setState({ confirmRemovalForTranslationId: '' })}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        )
                      : <span onClick={() => this.remove(translation._id)} style={{ cursor: 'pointer' }}>[DELETE]</span>
                    }
                  </div>
                </div>
              </div>
            )
          })}
        </td>
      </tr>
    )
  }

  renderRow(keyLanguage) {
    const buttonClass = this.props.isLoading ? 'text-muted' : 'text-primary'
    const hasMine = Boolean(keyLanguage.translations.findIndex(({ author }) => author._id === this.props.userId) + 1)

    return [
      <tr className='text-secondary' key={keyLanguage._id} style={{ fontSize: '12px' }}>
        <td key={`${keyLanguage._id}-name`}>{keyLanguage.key.name}</td>
        <td key={`${keyLanguage._id}-version`}>v{keyLanguage.version}</td>
        <td key={`${keyLanguage._id}-updatedAt`}>{moment(keyLanguage.createdAt).fromNow()}</td>
        {keyLanguage.note !== undefined && keyLanguage.note.length !== 0
          ? (
            <td
              className='text-center text-info list__iconCell list__iconCell-action'
              key={`${keyLanguage._id}-note`}
              title={keyLanguage.key.note}
            >
              <i children='note' className='material-icons' />
            </td>
          )
          : <td className='list__iconCell' key={`${keyLanguage._id}-note`} />
        }
        {keyLanguage.key.url !== undefined && keyLanguage.key.url.length !== 0
          ? (
            <td
              className='text-center text-info list__iconCell list__iconCell-action'
              key={`${keyLanguage._id}-url`}
              onClick={() => window.open(keyLanguage.key.url, '_blank')}
            >
              <i className='material-icons'>link</i>
            </td>
          )
          : <td className='list__iconCell' key={`${keyLanguage._id}-url`} />
        }
        <td
          className='text-right text-info'
          key={`${keyLanguage._id}-translate`}
          rowSpan='2'
        >
          <button
            children='Translate'
            className='btn btn-sm btn-success'
            disabled={keyLanguage.isDone || this.isLoading || hasMine}
            onClick={() => this.toggleTranslationForm(keyLanguage._id)}
            type='button'
          />
        </td>
      </tr>,
      <tr key={`${keyLanguage._id}-projects`}>
        <td className='pt-0 border-top-0' colSpan='5' style={{ lineHeight: 1 }}>
          {keyLanguage.projects.map(({ _id, name: _name }) =>
            <span children={_name} className='badge badge-info no-select mr-1' key={_id} />,
          )}
        </td>
      </tr>,
      <tr key={`${keyLanguage._id}-value`}>
        <td className='pt-0 border-top-0' colSpan='6' ref={this.highlightMarkdown}>
          <pre className='bg-light pre-scrollable list__markdownHighlight p-2 mt-3' style={{ maxWidth: this.state.rowWidth }}>
            <code
              children={keyLanguage.key.value}
              className='markdown'
              ref={node => this.highlightValue(keyLanguage._id, node)}
            />
          </pre>
        </td>
      </tr>,
      !hasMine && keyLanguage._id === this.state.openedKeyLanguageId && this.renderForm(keyLanguage),
      keyLanguage.translations.length !== 0 && this.renderTranslations(keyLanguage, keyLanguage.translations),
    ]
  }

  render() {
    return (
      <table className='table table-sm'>
        <thead>
          <tr className={`no-select${this.props.isLoading ? ' text-muted' : ''}`}>
            <th scope='col'>Name</th>
            <th scope='col'>Version</th>
            <th scope='col'>
              Created
              <i className='material-icons'>arrow_drop_down</i>
            </th>
            <th scope='col' />
            <th scope='col' />
            <th scope='col' />
          </tr>
        </thead>
        <tbody>
          {this.props.items.map(this.renderRow.bind(this))}
        </tbody>
      </table>
    )
  }
}
