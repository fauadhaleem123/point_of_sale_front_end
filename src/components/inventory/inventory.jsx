import _ from "lodash";
import React, { Component } from "react";
import { Table, Input, Form, Button, Grid, Segment } from "semantic-ui-react";
import AddItem from "./addItem";
import http from "../../services/httpService";
import { apiUrl } from "../../utils/api-config";
import AddCategory from "../category/addCategory";
import Paginate from "./pagination";
import CategorySideBar from "../category/categorySideBar";

function searchingFor(item) {
  return function(x) {
    return x.name.toLowerCase().includes(item.toLowerCase());
  };
}

const initialPagination = {
  activePage: 1,
  totalPages: 0,
  per_page:10
}

export default class Inventory extends Component {
  state = {
    ...initialPagination,
    column: null,
    data: [],
    apiResponse: [],
    direction: null,
    item: "", 
    newCategories:[]
  };

  nextCategoryChild = obj => {
    if (obj.children.length > 0) this.checkCategoryTree(obj.children);
  };

  checkCategoryTree = arrayOfObj => {
    arrayOfObj.map(obj => {
      this.nextCategoryChild(obj);
    });
  };
  
  fetchCategoriesData = () => {
    let handler = this;
    http
      .get(apiUrl + "/api/v1/categories")
      .then(function(response) {
        handler.setState({
          apiResponse: response.data,
          newCategories: response.data
        });
        handler.checkCategoryTree(handler.state.data);
      })
      .catch(function(error) {});
  };
  
  fetchItemsData = () => {
    http
      .get(`${apiUrl}/api/v1/items`)
      .then(res => {
        const { activePage, per_page} = this.state;
        const itemData = res.data[1];
        this.setState({ 
          data: itemData,
        });
        this.handlePagination(activePage, per_page);
      })
      .catch(error => console.log("Error: ", error));
  };

  searchHandler = e => {
    this.setState({ item: e.target.value });
  };

  handleSort = clickedColumn => () => {
    const { column, data, direction } = this.state;
    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        data: _.sortBy(data, [clickedColumn]),
        direction: "ascending"
      });
      return;
    }
    this.setState({
      data: data.reverse(),
      direction: direction === "ascending" ? "descending" : "ascending"
    });
  };


  handlePagination = (page, per_page) => {
    this.setState({activePage: page, per_page:per_page });

    http
      .get(`${apiUrl}/api/v1/items`,{params:{page, per_page}})
      .then(res => {
        this.setState({
          data:res.data[1],
          totalPages: res.data[0].total
        });
      });
  }
  
  deleteItem = index => {
    const copyData = Object.assign([], this.state.data);
    var objToDelete = copyData[index];

    //delete request
    http
    .delete(`${apiUrl}/api/v1/items/${objToDelete.id}`)
    .then(res => {
      this.fetchItemsData();
    })
    .catch(error => console.log("Error: ", error));

  };

  filterItems = (cat_id) =>{
      http
      .get(`${apiUrl}/api/v1/items`, {params:{category_id: cat_id}})
      .then(res => {
        const itemData = res.data[1];
        this.setState({ 
          data: itemData,
        });
      })
      .catch(error => console.log("Error: ", error));
  }

  filterCategory = (item) => {
    this.setState({
      newCategories: item.children
    });
  }

  editItem = () => this.fetchItemsData();

  addItem = () =>  this.fetchItemsData();

  addCategory = () =>  this.fetchCategoriesData();
  
  componentDidMount() {
    this.fetchCategoriesData();
    this.fetchItemsData();
  }
  
  render() {
    const { column, data, direction, apiResponse, item, activePage, totalPages, per_page, newCategories } = this.state;
    
    return (
      <div>
        <Grid>
          <Grid.Column width={4}>
            <CategorySideBar filterItems={this.filterItems} filterCategory = {this.filterCategory} data={newCategories} />
          </Grid.Column>
          <Grid.Column width={12}>
            <Form>
              <Input
                icon="search"
                placeholder="Search..."
                onChange={this.searchHandler}
              />
              <AddItem addItem={this.addItem} data={apiResponse} />
              <AddCategory addCategory = {this.addCategory}  data={apiResponse} />
            </Form>
            <Table sortable celled fixed>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell
                    sorted={column === "name" ? direction : null}
                    onClick={this.handleSort("name")}
                  >
                    Name
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={column === "quantity" ? direction : null}
                    onClick={this.handleSort("quantity")}
                  >
                    Quantity
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={column === "category" ? direction : null}
                    onClick={this.handleSort("category")}
                  >
                    Category
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={column === "price" ? direction : null}
                    onClick={this.handleSort("price")}
                  >
                    Price
                  </Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {
                
                data.filter(searchingFor(item)).map((d, index) => (
                  <Table.Row key={d.id}>
                    <Table.Cell>{d.name}</Table.Cell>
                    <Table.Cell>{d.current_stock}</Table.Cell>
                    <Table.Cell>{d.category.name}</Table.Cell>
                    <Table.Cell>{d.sale_price}</Table.Cell>
                    <Table.Cell>
                      <Button
                        color="red"
                        icon="delete"
                        onClick={() => this.deleteItem(index)}
                      />
                      <AddItem itemData={d} editItem={this.editItem} data={apiResponse} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            {
              totalPages>0?
            <Paginate handlePagination = {this.handlePagination} pageSet ={{ activePage, totalPages, per_page }}/>:null
            }
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
