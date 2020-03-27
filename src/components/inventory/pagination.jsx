import React, { Component } from "react";
import { Pagination, Icon } from "semantic-ui-react";
class Paginate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePage: this.props.pageSet.activePage,
      totalPages: 0,
      per_page: this.props.pageSet.per_page
    };
  }

  handleActivePage = (e, { activePage }) => {
    this.setState({ activePage });
    const { per_page } = this.state;
    this.props.handlePagination(activePage, per_page);
  };

  componentDidMount() {
    const { totalPages } = this.props.pageSet;
    
    this.setState({ totalPages: totalPages });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pageSet.totalPages !== this.props.pageSet.totalPages) {
      const { totalPages } = this.props.pageSet
      this.setState({ totalPages: totalPages })
    }
  }

  render() {
    this.state.activePage = this.props.pageSet.activePage;
    return (
      <Pagination
        boundaryRange={0}
        activePage={this.state.activePage}
        siblingRange={2}
        disabled={this.state.totalPages < 2 ? true : false}
        firstItem={{ content: <Icon name="angle double left" />, icon: true }}
        lastItem={{ content: <Icon name="angle double right" />, icon: true }}
        prevItem={{ content: <Icon name="angle left" />, icon: true }}
        nextItem={{ content: <Icon name="angle right" />, icon: true }}
        totalPages={this.state.totalPages}
        onPageChange={this.handleActivePage}
      />
    );
  }
}
export default Paginate;
