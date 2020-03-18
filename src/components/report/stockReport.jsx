import React, { Component } from 'react';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { apiUrl } from "../../utils/api-config";
import http from "../../services/httpService";
import Paginate from "../inventory/pagination";
import { Button, Table, Container, Header, Image, Grid, Input, Search } from "semantic-ui-react";

const initialPagination = {
  activePage: 1,
  totalPages: 0,
  per_page: 6
};

class StockReport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...initialPagination,
      isLoading: true,
      itemsData: [],
      allItems: [],
      item: "",
      search: {
        isSearchLoading: false,
        results: [],
        value: ""
      }
    };
  }
  
  exportPDF = () => {
      const unit = "pt";
      const size = "A4"; // Use A1, A2, A3 or A4
      const orientation = "portrait"; // portrait or landscape
  
      const marginLeft = 40;
      const doc = new jsPDF(orientation, unit, size);
  
      doc.setFontSize(15);
  
      const title = "Items Stock Report";
      const headers = [["NAME","CATEGORY","SIZE", "STOCK", "UNIT PRICE"]];
      //const data = this.state.allItems.map(elt=> [elt.name, elt.category, elt.current_stock, elt.sale_price]);

      let name, category, itemSize, stock, price;
      let arr = []
      this.state.allItems.forEach(elt => {
        elt.item_sizes_attributes.forEach( item_sizes_attribute => {
          name = elt.name;
          category = elt.category;
          itemSize = item_sizes_attribute.size_attributes.size_type;
          stock = item_sizes_attribute.quantity;
          price = item_sizes_attribute.price
          arr.push([name, category, itemSize, stock, price])
        })
      })

      const data = arr;

      console.log(data, " :data")
      
      let content = {
        startY: 50,
        head: headers,
        body: data
      };
  
      doc.text(title, marginLeft, 40);
      doc.autoTable(content);
      doc.save("stock_report.pdf")

  }

  handlePagination = (page, per_page) => {
    this.setState({activePage: page, per_page:per_page });
    const { item } = this.state;

    http
      .get(`${apiUrl}/api/v1/items`,{params:{page, per_page, item}})
      .then(res => {
        
        
        this.setState({
          itemsData: res.data.items,
          totalPages: res.data.pages,
          isLoading: false
        });
      });
      this.setState({ state: this.state });
  };

  getItems = () => {
    http.get(`${apiUrl}/api/v1/items`).then(res => {
      this.setState({
        allItems: res.data.items,
        totalPages: res.data.pages
      }, () => this.getAllItems(2));
    });
  };

  getAllItems = async (page) => {
    
    let response;
    console.log()

    while ( page <= this.state.totalPages ) {

      response = await http.get(`${apiUrl}/api/v1/items`, { params: { page } })

      ++page;

      this.setState({ allItems: [ ...this.state.allItems , ...response.data.items], totalPages: response.data.pages  } )
    }
  }

  // searchHandler = e => {
  //   this.setState({ item: e.target.value },()=>{
  //     const {per_page} = this.state;
  //     this.handlePagination(1,per_page);
  //   });
  // };

  searchHandler = e => {
    let search = e.target.value
    let allItems = this.state.allItems.filter( singleItem => {
      let item = singleItem.name.toLowerCase();
      return item.indexOf(
        search.toLowerCase()) !== -1   
    })

    this.setState({ itemsData: allItems })

  };

  componentDidMount() {
    const { activePage, per_page } = this.state;
    this.handlePagination(activePage, per_page);
    this.getItems();
  }

  render() {
    const { itemsData, activePage, per_page, totalPages, isLoading } = this.state;
    // const { isSearchLoading, value, results } = this.state.search;

    let tableRows = !isLoading && itemsData ? itemsData.map( item => (
      item.item_sizes_attributes.map(item_sizes_attribute => (
        <Table.Row key={item.id + item_sizes_attribute.id}>
           <Table.Cell>{item.name}</Table.Cell>
           <Table.Cell>{item.category}</Table.Cell>
           <Table.Cell>{item_sizes_attribute.size_attributes.size_type}</Table.Cell>
           <Table.Cell>{item_sizes_attribute.quantity}</Table.Cell>
           <Table.Cell>{item_sizes_attribute.price}</Table.Cell>
        </Table.Row>
      ))
    ) ) : null

    return (
      <div>
        <Container className="page-header">
          <Header as="h2" className="second-header" floated="right">
            Devsinc
          </Header>
          <Header as="h2" floated="left">
            <Image className="logo" src={require("../../images/logo.png")} />
            <span className="header-text">Stock Report</span>
          </Header>
        </Container>
        <div className="ui divider"></div>
        <Grid columns={3}>
          <Grid.Row>
            <Grid.Column>
                {/* <Input
                  icon="search"
                  placeholder="Search Items"
                  onChange={this.searchHandler}
                /> */}
              {/* <Search
                loading={isLoading}
                onResultSelect={this.handleResultSelect}
                onSearchChange={_.debounce(this.handleSearchChange, 500, {
                  leading: true,
                })}
                results={results}
                value={value}
                {...this.props}
              /> */}
            </Grid.Column>
            <Grid.Column floated="right">
              <Button
              icon="download"
              content="Download"
              color="green"
              onClick={() => this.exportPDF()}
              style={{float:"right"}}
            />
            </Grid.Column>
          </Grid.Row>

        </Grid>
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Category</Table.HeaderCell>
              <Table.HeaderCell>Size</Table.HeaderCell>
              <Table.HeaderCell>Current Stock</Table.HeaderCell>
              <Table.HeaderCell>Unit Price</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {tableRows}
          </Table.Body>
        </Table>
        {totalPages > 0 ? (
          <Paginate
            handlePagination={this.handlePagination}
            pageSet={{ activePage, totalPages, per_page }}
          />
        ) : <h1 className="items-record">No Record Found</h1>}
      </div>
    );
  }
}
export default StockReport