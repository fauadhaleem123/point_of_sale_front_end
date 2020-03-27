import _ from 'lodash'
import React, { Component } from "react"
import { Search } from 'semantic-ui-react'

export default class SearchSize extends Component {
  constructor(props){
    super(props)
    this.state = { results: [], ...this.props.initialState }
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ value: result.title }, () => this.props.handleSizeChangeSearch(this.state.value, this.props.index) )
  }

  handleSearchChange = (e,  { value } ) => {
    this.setState({ isLoading: true, value })

    setTimeout(() => {
      if (this.state.value.length < 1) return this.setState({ isLoading: false, results: []})

      const re = new RegExp(_.escapeRegExp(this.state.value), 'i')
      const isMatch = (result) => re.test(result.title)
     
      this.setState({
        isLoading: false,
        results: _.filter(this.props.sizes, isMatch),
      })
      this.props.handleSizeChangeSearch(this.state.value, this.props.index)
    }
    , 300)
  }

  componentDidUpdate(prevProps){
    if (prevProps.initialState.value !== this.props.initialState.value){
      this.setState({ ...this.props.initialState })
    } 
  }
 
  render() {
    const { isLoading, value, results } = this.state;

    return (
      <Search
        loading={isLoading}
        onResultSelect={this.handleResultSelect}
        onSearchChange={_.debounce(this.handleSearchChange, 500, {
          leading: true,
        })}
        results={results}
        value={value}
        {...this.props}
      />
    )
  }
}
