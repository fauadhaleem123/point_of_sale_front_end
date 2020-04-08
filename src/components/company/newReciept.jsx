/* eslint-disable use-isnan */
import React, { Component } from "react";
import Select from "react-select";
import http from "../../services/httpService";
import { Input, Form, Button, Grid, Message, Container, Image, Header, Table, Icon, GridColumn } from "semantic-ui-react";
import { apiUrl } from "../../utils/api-config";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "react-datepicker/dist/react-datepicker.css";
import "./style.css"

const dateOptions = {
  year: "numeric",
  month: "long",
  day: "numeric"
};
const timeOptions = {
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
};

class NewReciept extends Component {
  constructor(props) {
    super(props);
    this.state = {
      current_item: [],
      item_count: 0,
      current_quantity: 0,
      selected_items: [],
      data: [],
      itemEmptyError: false,
      quantityEmptyError: false,
      quantityExceededError: false,
      stockEmptyError: false,
      invalidForm: false,
      invoiceCreated: false,
      total: 0,
      discounted_total: 0,
      discounts: [],
      current_discount: "",
      adjustment_amount: 0,
      totalBelowZeroError: false,
      discount_value:0,
      draftCreated: false,
      invoice_drafts: [],
      invoice_id: null,
      width: 0,
      height: 0
    };
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.updateWindowDimensions);

  }; 

  componentDidMount = () => {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    this.getData();
    this.getDrafts();
    this.getDiscounts();
  }

  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }

  getFirstPageItems = () => { 
    http
      .get(`${apiUrl}/api/v1/items`, { params: { page: 1 } })
      .then(res => {

        this.setState({ data:  [...res.data.items], page: res.data.page, totalPages: res.data.pages } , () => this.getAllItems(2) )
      })
      .catch(error => console.log("Error: ", error));
  } 

  getAllItems = async (page) => {
    
    let response;

    while ( page <= this.state.totalPages ) {

      response = await http.get(`${apiUrl}/api/v1/items`, { params: { page } })

      ++page;

      this.setState({ data: [ ...this.state.data , ...response.data.items] } )
    }
  }

  getData = () => {
    this.getFirstPageItems();
  };

  getDrafts = () => {
    http.get(apiUrl + "/api/v1/invoices", { params: {status: "drafted", order: "desc"}}).then(response => {
      this.setState({
        invoice_drafts: response.data.invoices
      });
    });
  };

  getDiscounts = () => {
    http.get(apiUrl + "/api/v1/discounts").then(response => {
      this.setState({
        discounts: response.data
      });
    });
  };

  handleInputChange = event => {
    let selected_object = event;
    this.setState({ current_item: selected_object }, function() {});
  };

  errorCheck = () => {
    let quantity = this.state.current_quantity;
    let current_item = this.state.current_item;

    if (this.state.current_item.length === 0) {
      this.setState({ itemEmptyError: true });
      setTimeout(()=>{ 
        this.setState({ itemEmptyError: false });
      }, 5000);

      return false;
    }

    if (this.state.current_quantity === 0) {
      this.setState({ quantityEmptyError: true });
      setTimeout(()=>{ 
        this.setState({ quantityEmptyError: false });
      }, 5000);

      return false;
    }

    if (current_item["current_stock"] < quantity) {
      this.setState({ quantityExceededError: true });
      setTimeout(()=>{ 
        this.setState({ quantityExceededError: false });
      }, 5000);
      
      return false;
    }

    return true;
  };

  populateSelectedItems = () => {
    
    let quantity = this.state.current_quantity;
    let current_item = this.state.current_item;
    let updated = [...this.state.selected_items];
   
    if (!this.errorCheck()) {
      return null;
    }
    
    const stock = current_item["current_stock"];

    let new_quantity = current_item["current_stock"] - quantity;
    current_item["current_stock"] = new_quantity;
    this.setState({ current_item });
    
    let new_data = [...this.state.data];

    new_data.forEach(data => {
      if (data.id === current_item["item_id"]) {
        data.item_sizes_attributes.forEach(item_sizes_attribute => {
          if (item_sizes_attribute.id === current_item["size_id"]) {
            item_sizes_attribute.quantity -= quantity
          }
        })
      }
    });

    let isSameItem = false;

    updated.forEach(data => {
      if (data.item_id === current_item["item_id"]) {
        if(data.size_id === current_item["size_id"]){
          data.quantity += Number(quantity)
          isSameItem = true;
        }
      }
    });
    
    let new_count = this.state.item_count;
    if (!isSameItem) {
      new_count++;
      current_item = {
        item_count: new_count,
        ...current_item,
        quantity: Number(quantity),
        original_quantity: stock,
        discount: current_item["discount"]
      };
      updated.push(current_item);
    }
    
    this.setState(
     { selected_items: updated, item_count: new_count, data: new_data },
     function() {
       this.setTotalBill();
     }
    );
    
  };

  setTotalBill = () => {
    let total_bill = 0.0;
    this.state.selected_items.forEach((data, index) => {
      let item_bill = this.itemTotal(data);

      total_bill = total_bill + item_bill;
    });

    let discounted_bill = 0.0;
    if (this.state.current_discount) {
      discounted_bill = this.discountedPrice(total_bill);
    } else {
      discounted_bill = total_bill;
    }

    if(this.state.adjustment_amount){
      discounted_bill += parseFloat(this.state.adjustment_amount);
    }

    if(discounted_bill < 0){
      this.setState({totalBelowZeroError: true})
    }
    else{
      this.setState({totalBelowZeroError: false})
    }

    this.setState({ total: total_bill, discounted_total: discounted_bill });
  };

  useDraft = (index) => {
    let invoice = this.state.invoice_drafts[index]
    let count = 0

    const invoice_items = invoice.sold_items.map(
      ({ item_id, sold_item_size, size_id, item, quantity, unit_price, discount }) => {
        return {
          value: item.name + " (" + sold_item_size + ") ",
          label: item.name + " (" + sold_item_size + ") ",
          size: sold_item_size,
          size_id: size_id,
          unit_price: unit_price,
          current_stock: item.current_stock - parseFloat(quantity),
          item_id: item_id,
          item_count: ++count,
          quantity: parseFloat(quantity),
          original_quantity: item.current_stock,
          discount: discount ? discount : 0   
        };
      }
    );

    this.setState({
      selected_items: invoice_items,
      total: invoice.total,
      adjustment: invoice.adjustment,
      item_count: count,
      invoice_id: invoice.id
    }, function() {
      this.setTotalBill();
    })
  }

  removeDraft = (index) => {
    let invoice_drafts = [...this.state.invoice_drafts];
    let draft = invoice_drafts.splice(index, 1);
    http
      .delete(apiUrl + "/api/v1/invoices/" + draft[0].id)
      .then((response) => {
        if(response.status === 200){
          if(draft[0].id === this.state.invoice_id)
          {
            this.setState({invoice_id: null})
          }
          this.getDrafts();
        }
      })
  }

  renderDraftTable() {
    return this.state.invoice_drafts.map((data, index) => {
      const { id, total} = data;
      return (
        <tr key={id}>
          <td>{id}</td>
          <td>{total}</td>
          <td>
          <Button 
            size="tiny"
            icon 
            labelPosition='right'
            onClick={() => {
              this.useDraft(index);
            }} 
            color={'teal'}>
              Use Draft
            <Icon name='check' />
          </Button>
          </td>
          <td>
          <Button
            icon="trash"
            className="remove-draft-btn"
            onClick={() => {
              this.removeDraft(index);
            }}
          />
          </td>
        </tr>
      );
    });
  }

  renderTableData() {
    return this.state.selected_items.map((data, index) => {
      let { item_count, value, unit_price, quantity, discount } = data;
      if(discount === null) {
        discount = 0
      }
      return (
        <tr key={item_count}>
          <td>{item_count}</td>
          <td>{value}</td>
          <td>{unit_price}</td>
          <td>{quantity}</td>
          <td>
            <Button
              icon="minus"
              className="decrease-discount-icon"
              onClick={() => {
                this.decreaseDiscount(index);
              }}
            />
            <input className="discount-align" value={discount} onChange={(e)=>this.handleDiscount(e, index)}/>%
            <Button
              icon="plus"
              className="increase-discount-icon"
              onClick={() => {
                this.increaseDiscount(index);
              }}
            />
          </td>
          <td>
            <span>{Number(this.itemTotal(data)).toFixed(2)}</span>
            <Button
              floated="right"
              icon="trash"
              className="remove-item-icon"
              onClick={() => {
                this.removeItem(index);
              }}
            />
          </td>
        </tr>
      );
    });
  }

  itemTotal = item => {
    let item_bill = parseFloat(
      Number(item.unit_price * item.quantity).toFixed(2)
    );

    if (item.discount > 0) {
      let discounted_bill = item_bill * (item.discount / 100);
      item_bill = item_bill - discounted_bill;
    }

    return item_bill;
  };

  handleDiscount=(e, index)=>{
    let new_selected = [...this.state.selected_items];
    if (new_selected[index].discount < 100) {
      if(!e.target.value)
        new_selected[index].discount = 0;
      else
        new_selected[index].discount = parseInt(e.target.value);
      this.setState({ selected_items: new_selected }, function() {
        this.setTotalBill();
      });
    }
  }
  
  increaseDiscount = index => {
    let new_selected = [...this.state.selected_items];
    if (new_selected[index].discount < 100) {
      new_selected[index].discount += 1;
      this.setState({ selected_items: new_selected }, function() {
        this.setTotalBill();
      });
    }
  };

  decreaseDiscount = index => {
    let new_selected = [...this.state.selected_items];
    if (new_selected[index].discount > 0) {
      new_selected[index].discount -= 1;
      this.setState({ selected_items: new_selected }, function() {
        this.setTotalBill();
      });
    }
  };

  removeItem = index => {
    let new_selected = [...this.state.selected_items];
    let new_data = [...this.state.data];
    let item = new_selected.splice(index, 1);
    let count = 0;

    //assign new indexes
    new_selected.forEach(data => {
      count++;
      data.item_count = count;
    });

    //reset quantity
    new_data.forEach(data => {
      if (data.id === item[0].item_id) {
        data.current_stock = item[0].original_quantity;
      }
    });

    this.setState(
      { selected_items: new_selected, data: new_data, item_count: count },
      function() {
        this.setTotalBill();
      }
    );
  };

  updateQuantity = event => {
    let new_quantity = event.target.value;
    this.setState({ current_quantity: new_quantity }, function() {});
  };

  createReciept = e => {
    if(this.state.totalBelowZeroError){
      return null;
    }

    if (this.state.selected_items.length === 0) {
      this.setState({ invalidForm: true });
      setTimeout(()=>{ 
        this.setState({ invalidForm: false });
      }, 5000);
      
      return null;
    }

    if(e.target.innerHTML === "Pay Bill"){
      let new_selected_items = []
      new_selected_items =  this.deleteUnpermittedProperties(this.state.selected_items);
      

      http
      .post(apiUrl + "/api/v1/invoices", {
        total: this.state.discounted_total,
        sold_items_attributes: new_selected_items,
        discount_id: this.state.current_discount.id,
        adjustment: this.state.adjustment_amount,
        status: "completed",
        invoice_id: this.state.invoice_id
      })
      .then(response => {
        if (response.status === 201) {
          this.setState({ invoiceCreated: true, invoice_id: response.data.id }, () => this.printInvoice(this.state.invoice_id));
          setTimeout(()=>{ 
            this.setState({ invoiceCreated: false });
          }, 5000);
        }
        this.getData();
        this.getDrafts();
        this.setState({
          selected_items: [],
          current_quantity: 0,
          current_item: [],
          total: 0,
          item_count: 0,
          current_discount: "",
          discounted_total: 0,
          adjustment_amount: 0,
          invoice_id: null
        });
      });
    }
    else if(e.target.innerHTML === "Save as draft") {
      let new_selected_items = []

      new_selected_items =  this.deleteUnpermittedProperties(this.state.selected_items);
      http
      .post(apiUrl + "/api/v1/invoices", {
        total: this.state.discounted_total,
        sold_items_attributes: new_selected_items,
        discount_id: this.state.current_discount.id,
        adjustment: this.state.adjustment_amount,
        status: "drafted",
        invoice_id: this.state.invoice_id
      })
      .then(response => {
        if (response.status === 201) {

          this.setState({ draftCreated: true, invoice_id: response.data.id });
          setTimeout(()=>{ 
            this.setState({ draftCreated: false });
          }, 5000);
        }
        this.getData();
        this.getDrafts();
      });
      
    }
  };

  printInvoice = (invoice) => {
    const unit = "pt";
    const size = "A4"; // Use A1, A2, A3 or A4
    const orientation = "portrait"; // portrait or landscape
    let title = "";
    let headers = "";
    let salesContent = [];
    const marginLeft = 40;
    const doc = new jsPDF(orientation, unit, size);
    doc.setFontSize(15);

    console.log(this.state, " :this.state.selectedItems")
    console.log(invoice, " :invoice")

    const date = new Intl.DateTimeFormat("en-PK", dateOptions).format(
      new Date()
    );
    const time = new Intl.DateTimeFormat("en-PK", timeOptions).format(
      new Date()
    );
      title = "Invoice Id: " + invoice + "       " + "       " + " " +  " Date: " + date + "       " + "       " + " " + " Time: " + time;
      headers = [["Item No.", "Name", "Sale Price", "Quantity", " Discount", "Total"]];
      let totalBill = 0;
      this.state.selected_items.forEach(elt => {
        let totalItemBill = (elt.quantity * elt.unit_price) - ((elt.quantity * elt.unit_price) * (elt.discount/100))
        totalBill = totalBill + totalItemBill
       
        salesContent.push([elt.item_count, elt.label, elt.unit_price, elt.quantity, elt.discount, totalItemBill]);
      });

      salesContent.push(["","","","", "Total Bill: ", totalBill])
      salesContent.push(["","","","", "Adjusted Amount: ", this.state.adjustment_amount])
      let adjustedPrice = totalBill + parseFloat(this.state.adjustment_amount)

      salesContent.push(["","","","", "Final Amount: ", adjustedPrice])

      let content = {
        startY: 50,
        head: headers,
        body: salesContent
      };

      doc.text(title, marginLeft, 40);
      doc.autoTable(content);
      doc.save("invoice.pdf");
  }

  deleteUnpermittedProperties = selected_items => {
    let new_selected_items = []
    new_selected_items = selected_items.map( selected_item => {
     return {...selected_item}
    })

    new_selected_items.forEach(selected_item => {
      delete selected_item.item_count
      delete selected_item.value
      selected_item.sold_item_size = selected_item.size;
      delete selected_item.size
      delete selected_item.label
      delete selected_item.current_stock
      delete selected_item.original_quantity
    })

    return new_selected_items
  }

  setDiscount = e => {
    let selected_discount = e;
    this.setState({ current_discount: selected_discount }, () => {
      if (this.state.total > 0) {
        let total = this.state.total;
        this.setState({ discounted_total: this.discountedPrice(total) });
      }
    });
  };

  clearDiscount = () => {
    this.setState({ current_discount: "", discounted_total: this.state.total });
  };

  discountedPrice = total_bill => {
    let discount_amount = total_bill * (this.state.current_discount.rate / 100);
    return total_bill - discount_amount;
  };

  setAdjustment = event => {
    this.setState({adjustment_amount: event.target.value}, function() {
      if(this.state.selected_items.length > 0) {
        this.setTotalBill();
      }
    })
  }

  render() {
    let itemList = [];

    let margin = this.state.width < 1000 ? { marginLeft: "25px" } : {}
    let marginUp = this.state.width < 1000 ? { marginLeft: "25px", marginTop: "10px" } : {}
    let buttonMargin = this.state.width < 378  ? { marginTop: "5px"}: {}
    
    let x = this.state.data ? this.state.data.forEach (
      item => (
        item.item_sizes_attributes.forEach(item_sizes_attribute => {
          itemList.push({
            value: item.name + " (" + item_sizes_attribute.size_attributes.size_type + ")",
            label: item.name + " (" + item_sizes_attribute.size_attributes.size_type + ")",
            category: item.category,
            size: item_sizes_attribute.size_attributes.size_type,
            size_id: item_sizes_attribute.size_attributes.size_id,
            discount: item_sizes_attribute.discount,
            unit_price: item_sizes_attribute.price,
            current_stock: item_sizes_attribute.quantity,
                
            item_id: item.id
          })
          return null;
        })
      )
    ): null;

 
    return (
      <React.Fragment>
        <Container className="page-header">
          <Header as='h2' className="second-header" floated='right'>
            <span className="home_header">Devsinc</span>
          </Header>
          <Header className="home_header" as='h2' floated='left'>
              <Image className="logo" src={require('../../images/company_icon.jpeg')} />
              <span  className="header-text home_header">New Invoice</span>
          </Header>
        </Container>
        <div className="ui divider"></div>   
        <Grid centered>
          <Grid.Row>
            <Grid.Column width={16} style={margin}>
              <Form error success>
                <Form.Field
                  type="text"
                  control={Select}
                  search
                  selection
                  value={this.state.current_item}
                  label={{ children: "Select or Search Item" }}
                  options={itemList}
                  onChange={this.handleInputChange}
                  placeholder="Search..."
                />
                {this.state.itemEmptyError ? (
                  <Message
                    error
                    header="Item not selected"
                    content="Please select an item to purchase"
                  />
                  ) : null}
                <Form.Field
                  control={Input}
                  type="number"
                  value={this.state.current_quantity}
                  onChange={this.updateQuantity}
                  label={{
                    children: "Select Quantity",
                    htmlFor: "form-select-control-gender"
                  }}
                  placeholder="Quantity"
                  min="1"
                />
                {this.state.quantityEmptyError ? (
                  <Message
                    error
                    header="Quantity Empty"
                    content="Please provide item quantity"
                  />
                ) : null}
                {this.state.quantityExceededError ? (
                  <Message
                    error
                    header="Item quantity limit reached!"
                    content={
                      "Current stock only contains " +
                      this.state.current_item["current_stock"] +
                      " units"
                    }
                  />
                ) : null}
                <Form.Field
                  id="form-button-control-secondary"
                  control={Button}
                  color = "blue"
                  content="Add to Invoice"
                  label=""
                  onClick={this.populateSelectedItems}
                />
              </Form>
              <div className="drafts-container" >
                <h3 className="drafts-heading">Recent Invoice Drafts</h3>
                <Table color={'teal'} key={'teal'}>
                  <Table.Header >
                    <Table.Row >
                      <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                      <Table.HeaderCell>Total</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                      <Table.HeaderCell/>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {this.renderDraftTable()}
                  </Table.Body>
                </Table>
              </div>
            </Grid.Column>
            <Grid.Column width={16} style={marginUp}>
              <div className="drafts-container">
              <h3 className="drafts-heading">Invoice</h3>

                <table className="ui compact table">
                  <thead>
                    <tr>
                      <th>Item No.</th>
                      <th>Name</th>
                      <th>Sale Price</th>
                      <th>Quantity</th>
                      <th>Discount</th>
                      <th>Total($)</th>
                    </tr>
                  </thead>
                  <tbody>{this.renderTableData()}</tbody>
                  <tfoot>
                    <tr>
                      <th />
                      <th />
                      <th />
                      <th />
                      <th>
                        <b>Total Bill:</b>
                      </th>
                      <th>{Number(this.state.total).toFixed(2)}</th>
                    </tr>
                    <tr>
                      <th />
                      <th />
                      <th />
                      <th />
                      <th className="width-32">
                        <Input type='number' 
                              placeholder='Adjustment'
                              value={this.state.adjustment_amount}
                              onChange={this.setAdjustment}>
                          <input />
                        </Input>
                      </th>
                      <th />
                    </tr>
                    <tr>
                      <th />
                      <th />
                      <th />
                      <th />
                      <th>
                        <b>Final Amount:</b>
                      </th>
                      <th>{Number(this.state.discounted_total).toFixed(2)}</th>
                    </tr>
                  </tfoot>
                </table>
                {this.state.invalidForm ? (
                  <Message
                    error
                    header="Invoice Empty"
                    content="Please add items to the invoice"
                  />
                ) : null}
                {this.state.totalBelowZeroError ? (
                  <Message
                    error
                    header="Total Below Zero"
                    content="The total bill should be greater or equal to 0"
                  />
                ) : null}
                {this.state.invoiceCreated ? (
                  <Message
                    success
                    header="Invoice Created"
                    content="Your invoice has been processed successfully!"
                  />
                ) : null}
                {this.state.draftCreated ? (
                  <Message
                    success
                    header="Draft Created"
                    content="Your invoice draft has been saved successfully!"
                  />
                ) : null}
                { this.state.width < 1300 &&
                <Grid.Row style={{marginLeft: "2px"}}>
                  <Grid.Column width="2">
                    <Button size="tiny"  primary className="submit-btn" onClick={this.createReciept}>
                      Pay Bill
                    </Button>
                  </Grid.Column>
                  
                  <Grid.Column width="2">
                  <Button size="tiny" style={buttonMargin}   color='teal' onClick={this.createReciept} >
                    Save as draft
                  </Button>
                  </Grid.Column>
                </Grid.Row>
                }
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  }
}

export default NewReciept;
