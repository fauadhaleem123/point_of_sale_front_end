import _ from "lodash";
import React, { Component, createRef } from "react";
import {
  Table,
  Form,
  Button,
  Grid,
  Modal,
  Header,
  Container,
  Image,
  Search,
  Sticky ,
  Ref,
  Segment
} from "semantic-ui-react"; 
import AddItem from "./addItem";
import http from "../../services/httpService";
import { apiUrl } from "../../utils/api-config";
import AddCategory from "../category/addCategory";
import Paginate from "./pagination";
import CategorySideBar from "../category/categorySideBar";
import Barcode from "react-barcode";
import Loader from "../Loader/loader";
import "../company/style.css"

const initialPagination = {
  activePage: 1,
  totalPages: 0,
  per_page: 2
};

const initialState = { isSearchLoading: false, results: [], value: '' }

export default class Inventory extends Component {
  contextRef = createRef()
  state = {
    ...initialPagination,
    open: false,
    column: null,
    categoryID: null,
    categoryName: "",
    direction: null,
    sizes: [],
    item: "",
    data: [],
    isLoading: true,
    apiResponse: [],
    newCategories: [],
    turnOffPagination: false,
    paginationByCategory: false,
    search: {
      isSearchLoading: false,
      results: [],
      value: ""
    },
    width: 0,
    height: 0
  };



  close = () => {
    this.setState({
      open: false
    });
  };

  show = () => {
    this.setState({
      open: true
    });
  };

  nextCategoryChild = obj => {
    if (obj.children.length > 0) this.checkCategoryTree(obj.children);
  };

  checkCategoryTree = arrayOfObj => {
    arrayOfObj.forEach(obj => {
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


  fetchSizes = () => {
    
    http.get(apiUrl + "/api/v1/sizes")
      .then(response => {     
        this.setState({
          sizes: response.data
        });
      })
      .catch(error => console.log(error));
      
  };

  searchHandler = e => {
    this.setState({ item: e.target.value }, () => {
      const { per_page, categoryID, item } = this.state;
      http
        .get(`${apiUrl}/api/v1/items`, {
          params: { page: 1, per_page, category_id: categoryID, item }
        })
        .then(res => {
          this.setState({
            data: res.data[1],
            totalPages: res.data[0].total
          });
        })
        .catch(error => console.log("Error : ", error));
    });
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

  pageHandler = () => {
    const { activePage, per_page } = this.state;
    this.handlePagination(activePage, per_page);
  };

  handlePagination = (page, per_page) => {
    if (this.state.paginationByCategory) {
      this.setPaginationAfterFilteringByCategory(null, page)
    }
    else {
      this.setState({ activePage: page, per_page: per_page });

      if (this.state.categoryID) {
        this.filterItems(this.state.categoryID);
      } else {
        http
          .get(`${apiUrl}/api/v1/items`, { params: { page, per_page} })
          .then(res => {
            this.setState({
              data: res.data.items,
              totalPages: res.data.pages,
              isLoading: false
            }, () => this.reload());
          })
          .catch(error => console.log("Error : ", error));

      this.setState({ state: this.state });
    }
    }
    
  };

  reload = () => {
    this.setState({ reload: true })
  }

  confirmDelete = (item, size) => {
    this.deleteItem(item.id, size);
  };

  deleteItem = (id, size) => {
    http
      .delete(`${apiUrl}/api/v1/items/${id}?size=${size}`)
      .then(res => {
        this.pageHandler();
      })
      .catch(error => console.log("Error: ", error));

    this.close();
  }

  filterByCategory =  (cat_name, cat_id, page) => {
    this.setState({
      categoryName: cat_name,
      categoryID: cat_id
    });
    
    let categories = []

    this.state.apiResponse.forEach( category => {

      if (cat_id === category.id) {
        categories.push(category.name)
        
        if (category.children.length > 0 ) {
          category.children.forEach( child => {
            categories.push(child.name)
          })
        }
      }

      if (category.children.length > 0 ) {
        category.children.forEach( child => {
          if (cat_id === child.id) {
            categories.push(child.name)
          }
        })
      }
    })

     
    let itemsData = []
    console.log(this.state.allItems, " :this.state.allItems")
    console.log(this.state, " :this.state")

    this.state.allItems.items.forEach( item => {
      categories.forEach( category => {
        if (item.category === category) {
          itemsData.push(item)
        }
      })
    })

    let currentPage = page ? page : 1
    this.setState({
      filteredCategoryItems: itemsData
    })

    this.setPaginationAfterFilteringByCategory(itemsData, currentPage)
  }

  setPaginationAfterFilteringByCategory = (items, page) => {
    this.setState({ activePage: page })
    if (!items) {
      items = this.state.filteredCategoryItems
    }
    let start = (page - 1) * this.state.per_page;
    let end = start + (this.state.per_page - 1)

    let filteredItems = items.filter( (item, i) => {
      if (i >= start && i <= end) return true;
    })

    this.setState({
      data: filteredItems,
      totalPages: Math.ceil(items.length/this.state.per_page),
      isLoading: false,
      paginationByCategory: true
    }, () => this.reload())

  }

  allCategoriesClicked = () => {
    this.setState({ paginationByCategory: false }, () => this.handlePagination(1, this.state.per_page))
  }

  filterItems = (cat_name, cat_id) => {
    this.setState({
      categoryName: cat_name,
      categoryID: cat_id
    });

    http
      .get(`${apiUrl}/api/v1/items`, { params: { category_id: cat_id } })
      .then(res => {
        const itemData = res.data.items;
        const count = res.data.pages;
        this.setState({
          data: itemData,
          totalPages: count
        });
      })
      .catch(error => console.log("Error: ", error));
  };

  filterCategory = category => {
    
    this.setState({
      newCategories: category.children,
      categoryName: category.name
    });
  };

  editItem = () => {
    this.pageHandler();
  };
  addItem = () => {
    this.getFirstPageItems();
    this.pageHandler();
  };

  addCategory = () => this.fetchCategoriesData();

  gotoHome = () => {
    this.componentDidMount();
  };

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    this.fetchCategoriesData();
    this.fetchSizes();
    this.setState({
      activePage: 1,
      categoryID: null,
      categoryName: ""
    });
    this.getFirstPageItems()

    const { per_page } = this.state;
    this.handlePagination(1, per_page);
  }

  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  getFirstPageItems = () => {    
    http
      .get(`${apiUrl}/api/v1/items`, { params: { page: 1 } })
      .then(res => {

        this.setState({ allItems: { items: [...res.data.items], page: res.data.page, totalPages: res.data.pages } }, () => this.getAllItems(2) )
      })
      .catch(error => console.log("Error: ", error));
  }

  getAllItems = async (page) => {
    
    let response;

    let allPages = this.state.allItems.totalPages

    while ( page < allPages ) {

      response = await http.get(`${apiUrl}/api/v1/items`, { params: { page } })
    
      page = page+1;
      this.setState({ allItems: { items: [ ...this.state.allItems.items , ...response.data.items] } } )
    }
    response = await http.get(`${apiUrl}/api/v1/items`, { params: { page } })
    this.setState({ allItems: { items: [ ...this.state.allItems.items , ...response.data.items] } }, () => this.mapItemsToItemName() )
  }

  mapItemsToItemName = () => {
    
    let itemsName = this.state.allItems.items.map( item => {
      return {title:  item.name}
    })
    this.setState({itemsName})
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ value: result.title })
    let selectedItems = this.state.allItems.items.filter( item => item.name === result.title )
   this.setState({ currentItems: [...this.state.data] , data: selectedItems, turnOffPagination: true  })
  }

  handleSearchChange = (e, { value }) => {

    const { itemsName } = this.state
    this.setState({  search: {  ...this.state.search,  value: value, isSearchLoading: true} })

    setTimeout(() => {
      if (this.state.search.value.length < 1 && this.state.currentItems ) return this.setState({ search: initialState, turnOffPagination: false, data: [...this.state.currentItems] })
      else if (this.state.search.value.length < 1) return this.setState({ search: initialState, turnOffPagination: false })

      const re = new RegExp(_.escapeRegExp(this.state.search.value), 'i')
      const isMatch = (result) => re.test(result.title)

      this.setState({
        search : {
          ...this.state.search,
          isSearchLoading: false,
          results:  _.filter(itemsName, isMatch)
        }
      })
    }, 300)
  }



  render() {
    let bool = this.state.width < 1000 ? true : false
    const {
      column,
      isLoading,
      data,
      direction,
      apiResponse,
      activePage,
      totalPages,
      per_page,
      newCategories,
      sizes
    } = this.state;
    const { isSearchLoading, value, results } = this.state.search;

    return ( 
      <div>
        <Container className="page-header">
          <Header as="h2" className="second-header" floated="right">
            <span className="home_header">Devsinc</span>
          </Header>
          <Header as="h2" floated="left">
            <Image className="logo" src={require("../../images/logo.png")} />
            <span className="header-text home_header">Item Inventory</span>
          </Header>
        </Container>
        <div className="ui divider"></div>
        { this.state.width < 1000 &&
          <Grid>
          <Grid.Row>
            <Grid.Column width={16} >
              <CategorySideBar
                width
                gotoHome={this.gotoHome}
                filterItems={this.filterItems}
                filterCategory={this.filterByCategory}
                data={newCategories}
                headerClicked={this.allCategoriesClicked}
              />
            </Grid.Column>
          </Grid.Row>
          <div style={{ marginLeft: '50px', marginTop: "10px"}}>
          <Grid.Row>
            <Grid.Column width={16}>
              <Form>
                <Search
                  loading={isSearchLoading}
                  placeholder="Search Items"
                  onResultSelect={this.handleResultSelect}
                  onSearchChange={_.debounce(this.handleSearchChange, 500, {
                    leading: true,
                  })}
                  results={results}
                  value={value}
                  {...this.props}
                />
              </Form>  
            </Grid.Column>
          </Grid.Row>
          </div>
          <div style={{ marginLeft: '50px', marginTop: "10px"}}>
          <Grid.Row >
            {apiResponse.length > 0 &&
              
              this.props.role === "read_and_write" ? (
                <Grid.Column width={4}>
                  <AddItem
                    addItem={this.addItem}
                    data={apiResponse}
                    sizes={sizes}
                    fetchSizes={this.fetchSizes}
                    items={this.state.allItems? this.state.allItems.items: null}
                  />
                </Grid.Column>
              ) : null}
          </Grid.Row>
          </div>
          <div style={{ marginLeft: '50px', marginTop: "10px"}}>
            <Grid.Row>
          <Grid.Column>
                {this.props.role === "read_and_write" && (
                  <AddCategory
                    addCategory={this.addCategory}
                    data={apiResponse}
                  />
                )}
              </Grid.Column>
              </Grid.Row>
          </div>
          <div style={{ marginLeft: '50px', marginTop: "10px"}}>
            <Grid.Row>
            <Grid.Column width={16}>
            <div style={{ width: "100%" }}>
            <h3 className="drafts-heading">Items</h3>


            <Table sortable celled fixed> 
              <Table.Header>
              <div>

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
                    sorted={column === "size" ? direction : null}
                    onClick={this.handleSort("size")}
                  >
                    Size
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={column === "code" ? direction : null}
                    onClick={this.handleSort("code")}
                  >
                    QR Code
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
                </div>
              </Table.Header>

              <Table.Body>
                {!isLoading ? (
                  data ? (data.map(item =>
                    item.item_sizes_attributes.map(item_size => {
                      return (
                        <Table.Row key={item_size.code}>
                          <Table.Cell>{item.name}</Table.Cell>
                          <Table.Cell>{item_size.quantity}</Table.Cell>
                          <Table.Cell>
                            {item_size.size_attributes.size_type}
                          </Table.Cell>
                          <Table.Cell className="barcode">
                            <Barcode value={item_size.code} />
                          </Table.Cell>
                          <Table.Cell>{item.category}</Table.Cell>
                          <Table.Cell>{item_size.price}</Table.Cell>
                          <Table.Cell>
                            <Modal
                              dimmer="inverted"
                              trigger={
                                <Button
                                  basic
                                  color="red"
                                  icon="trash alternate outline"
                                />
                              }
                              basic
                              size="tiny"
                              header={
                                <Header
                                  icon="trash alternate outline"
                                  content="Are you Sure"
                                />
                              }
                              actions={[
                                {
                                  key: "ok",
                                  content: "Ok",
                                  positive: true,
                                  onClick: () => this.confirmDelete(item, item_size.size_attributes.size_id)
                                }
                              ]}
                              onClose={this.close}
                            />
                            <AddItem
                              itemData={item}
                              editItem={this.editItem}
                              data={apiResponse}
                              sizes={sizes}
                              fetchSizes={this.fetchSizes}
                              check={true}
                              items={this.state.allItems? this.state.allItems.items: null}
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })
                  )
                ):null) : (
                  <Loader />
                )}
              </Table.Body>
            </Table>
            </div>
            </Grid.Column>
            </Grid.Row>
          </div>
          <div style={{ marginLeft: '50px', marginTop: "10px"}}>
            <Grid.Row>
            {totalPages > 0 && !this.state.turnOffPagination ? (
              <Paginate
                handlePagination={this.handlePagination}
                pageSet={{ activePage, totalPages, per_page, data }}
                width
              />
            ) : (
              totalPages <= 0 ? <h1 className="items-record">No Record Found</h1> : null
            )}
            </Grid.Row>
          </div>
          </Grid>
        }  
        { this.state.width >= 1000 && 
        <Grid>
          <Grid.Column width={4}>
            <CategorySideBar
              gotoHome={this.gotoHome}
              filterItems={this.filterItems}
              filterCategory={this.filterByCategory}
              data={newCategories}
              headerClicked={this.allCategoriesClicked}
            />
          </Grid.Column>
          <Grid.Column width={10}>
            <Form>
              <Search
                loading={isSearchLoading}
                placeholder="Search Items"
                onResultSelect={this.handleResultSelect}
                onSearchChange={_.debounce(this.handleSearchChange, 500, {
                  leading: true,
                })}
                results={results}
                value={value}
                {...this.props}
              />
              {apiResponse.length > 0 &&
              this.props.role === "read_and_write" ? (
                <AddItem
                  addItem={this.addItem}
                  data={apiResponse}
                  sizes={sizes}
                  fetchSizes={this.fetchSizes}
                  items={this.state.allItems? this.state.allItems.items: null}
                />
              ) : null}
              {this.props.role === "read_and_write" && (
                <AddCategory
                  addCategory={this.addCategory}
                  data={apiResponse}
                />
              )}
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
                    sorted={column === "size" ? direction : null}
                    onClick={this.handleSort("size")}
                  >
                    Size
                  </Table.HeaderCell>
                  <Table.HeaderCell
                    sorted={column === "code" ? direction : null}
                    onClick={this.handleSort("code")}
                  >
                    QR Code
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
                {!isLoading ? (
                  data ? (data.map(item =>
                    item.item_sizes_attributes.map(item_size => {
                      return (
                        <Table.Row key={item_size.code}>
                          <Table.Cell>{item.name}</Table.Cell>
                          <Table.Cell>{item_size.quantity}</Table.Cell>
                          <Table.Cell>
                            {item_size.size_attributes.size_type}
                          </Table.Cell>
                          <Table.Cell className="barcode">
                            <Barcode value={item_size.code} />
                          </Table.Cell>
                          <Table.Cell>{item.category}</Table.Cell>
                          <Table.Cell>{item_size.price}</Table.Cell>
                          <Table.Cell>
                            <Modal
                              dimmer="inverted"
                              trigger={
                                <Button
                                  basic
                                  color="red"
                                  icon="trash alternate outline"
                                />
                              }
                              basic
                              size="tiny"
                              header={
                                <Header
                                  icon="trash alternate outline"
                                  content="Are you Sure"
                                />
                              }
                              actions={[
                                {
                                  key: "ok",
                                  content: "Ok",
                                  positive: true,
                                  onClick: () => this.confirmDelete(item, item_size.size_attributes.size_id)
                                }
                              ]}
                              onClose={this.close}
                            />
                            <AddItem
                              itemData={item}
                              editItem={this.editItem}
                              data={apiResponse}
                              sizes={sizes}
                              fetchSizes={this.fetchSizes}
                              check={true}
                              items={this.state.allItems? this.state.allItems.items: null}
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })
                  )
                ):null) : (
                  <Loader />
                )}
              </Table.Body>
            </Table>
            {totalPages > 0 && !this.state.turnOffPagination ? (
              <Paginate
                handlePagination={this.handlePagination}
                pageSet={{ activePage, totalPages, per_page, data }}
              />
            ) : (
              totalPages <= 0 ? <h1 className="items-record">No Record Found</h1> : null
            )}
          </Grid.Column>
        </Grid>}
      </div>
    );
  }
}
