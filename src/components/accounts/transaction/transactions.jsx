import React, { Component } from "react";
import { Grid, Button, Icon, Message } from "semantic-ui-react";
import Filters from "./filter";
import { withRouter } from "react-router";
import http from "../../../services/httpService.js";
import { apiUrl } from "../../../utils/api-config";
import Paginate from "../../inventory/pagination"

const dateOptions = {
  year: "numeric",
  month: "long",
  day: "numeric"
};

const initialPagination = {
  activePage: 1,
  totalPages: 0,
  per_page: 15
};

class Transections extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...initialPagination,
      Transactions: [],
      allTransactions:[],
      Vendors: [],
      totalAmount: 0,
      filteringTransaction: false
    }
  } 

  handleClick = (id) => this.props.history.push("accounts/" + id);

  redirect = () => this.props.history.push("accounts/transaction/new");

  pageHandler = () => {
    const { activePage, per_page } = this.state;
    this.handlePagination(activePage, per_page);
  };

  calculateTransactionTotal = () => {
    let totalAmount = 0

    if (this.state.filteringTransaction) {
      
      const {filterTransactions} = this.state;
      Array.prototype.forEach.call(filterTransactions, element => {
        totalAmount = totalAmount + element.amount
      });
      this.setState({
        totalAmount: totalAmount
      });
    } else {
      const {Transactions} = this.state;

      Array.prototype.forEach.call(Transactions, element => {
      totalAmount = totalAmount + element.amount
      });
      this.setState({
        totalAmount: totalAmount
      });
    }
    
  }
  
  handlePagination = (page, per_page) => {
    this.setState({ activePage: page, per_page: per_page });
    // , { params: { page, per_page } }
    http
      .get(`${apiUrl}/api/v1/transactions`)
      .then(res => {
        this.setState({
          Transactions: res.data.results[1],
          totalPages: Math.ceil(res.data.results[0].total/this.state.per_page)
        }, () => this.getInvoice());
      })
      .catch(error => console.log(error))
  };

  getVendors = () => {
    http
      .get(`${apiUrl}/api/v1/vendors`)
      .then(res => {
        this.setState({
          Vendors: res.data.results[1]
        });
      })
      .catch(error => console.log(error));
  }

  filterTransactions = (transactions) => {

    let filteredTransactions = []
    if (transactions.startDate && transactions.endDate) {
      filteredTransactions = this.state.allTransactions.filter( transaction => {
        return new Date(transaction.transaction_date) >= transactions.startDate && new Date(transaction.transaction_date) <= transactions.endDate
      })
    } else {
      filteredTransactions = this.state.allTransactions
    }
      

    if (transactions.vendor.length > 0) {
      filteredTransactions = filteredTransactions.filter( transaction => {
        if (transaction.vendor) {
          return transactions.vendor === transaction.vendor.name
        }
        if (transaction.customer) {
          return transactions.vendor === transaction.customer.name
        }
      })
    }

    if (transactions.store.length > 0) {
      
      filteredTransactions = filteredTransactions.filter( transaction => {
        if (transaction.vendor) {
          
          return transactions.store === transaction.vendor.store_name
        }
        if (transaction.customer) {
          return transactions.store === transaction.customer.store_name
        }
      })
    }

    console.log(filteredTransactions, " :filteredTransaction")

    this.filterInvoices(transactions,filteredTransactions)
      
    //, {params:transactions}
    //http
    //  .get(`${apiUrl}/api/v1/transactions`, {params:transactions})
    //  .then(res => {
    //    console.log(res.data, " :filterTransactions")
    //    this.setState({
    //      filterTransactions: res.data.results[1],
    //      totalPages: res.data.results[0].total
    //    }, () => this.filterInvoices(transactions));
    //  })
    //  .catch(error => console.log(error))
  }

  filterInvoices = (transactions, filteredTransactions) => {
    let filteredInvoices = [];

    if (!(transactions.startDate && transactions.endDate) && (transactions.store.length <= 0 && transactions.vendor.length <= 0) ) {

      filteredInvoices = this.state.Transactions.filter( transaction => {
        return transaction.transaction_category === "invoice" 
      })

    } else {
      if ( !(transactions.store.length > 0 || transactions.vendor.length > 0)) {
        filteredInvoices = this.state.Transactions.filter( transaction => {
          return new Date(transaction.transaction_date) >= transactions.startDate && new Date(transaction.transaction_date) <= transactions.endDate && transaction.transaction_category === "invoice" 
        })
      }
    }

   this.setState({ filterTransactions: [ ...filteredTransactions,...filteredInvoices], filteringTransaction: true  }, () => this.setTotalPages())
  }

  setTotalPages = () => {
    this.setState({ totalPages: Math.ceil(this.state.filterTransactions.length/this.state.per_page) }, () => this.calculateTransactionTotal())
  }

  getAllTransactions = () => {
    http
      .get(`${apiUrl}/api/v1/transactions`)
      .then(res => {
        this.setState({
          allTransactions: res.data.results[1]
        });
      })
      .catch(error => console.log(error))
  }

  getInvoice = () => {  
    let invoices = []
    http
      .get(`${apiUrl}/api/v1/invoices`)
      .then( response => {
        invoices = response.data.invoices.map( invoice => {
          return {
            transaction_code: invoice.id,
            transaction_date: invoice.created_at,
            amount: parseFloat(invoice.total),
            transaction_category: "invoice",
            details: "nothing"
          }
        })
        this.setState({ Transactions: [...this.state.Transactions, ...invoices] }, () => this.setState( { totalPages: Math.ceil(this.state.Transactions.length/this.state.per_page)}, () => this.calculateTransactionTotal() )  )
      })
  }

  componentDidMount() {
    this.getAllTransactions();
    // this.getInvoice();
    this.pageHandler();
    this.getVendors();
  }

  render() {
    const {activePage, per_page, totalPages, Vendors, Transactions, totalAmount} = this.state;
    let start = (activePage* per_page) - 15;
    let end = (activePage* per_page) - 1
    return (
      <React.Fragment>
        <Filters users={Vendors} filterTransactions={this.filterTransactions}></Filters>
        <Grid>
          <Grid.Column width={16}>
            <Button style={{ background: "#58ae61", color: "white" }} floated="right" onClick={this.redirect}><Icon name="plus"></Icon>New</Button>
            <div className="table-wrapper-scroll-y my-custom-scrollbar">
              <table className="table table-bordered table-striped mb-1 account-table">
                <thead style={{ color: "white", background: "#1969a4" }}>
                  <tr>
                    <th scope="col">Txn ID  </th>
                    <th scope="col">Store Name</th>
                    <th scope="col">Transaction Date</th>
                    <th scope="col">User Name</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Account</th>
                    <th scope="col">Details</th>

                  </tr>
                </thead>
                <tbody>
                  {this.state.filterTransactions ? this.state.filterTransactions.map((item, i) => {
                    if (i >= start && i <= end) {
                      return (
                        <tr key={i}>
                          <th scope="row">{item.transaction_code}</th>
                          <td>{item.vendor_id?item.vendor.store_name:null}</td>
                          <td>{new Intl.DateTimeFormat("en-PK", dateOptions).format(
                            new Date(item.transaction_date)
                          )}
                          </td>
                          <td>{item.vendor_id?item.vendor.name:item.customer_id?item.customer.name:null}</td>
                          <td>{item.amount}</td>
                          <td>{item.transaction_category}</td>
                          <td>{item.details}</td>
                        </tr>)
                    } 
                  }): Transactions.map((item, i) => {
                    if (i >= start && i <= end) {
                      return (
                        <tr key={i}>
                          <th scope="row">{item.transaction_code}</th>
                          <td>{item.vendor_id?item.vendor.store_name:null}</td>
                          <td>{new Intl.DateTimeFormat("en-PK", dateOptions).format(
                            new Date(item.transaction_date)
                          )}
                          </td>
                          <td>{item.vendor_id?item.vendor.name:item.customer_id?item.customer.name:null}</td>
                          <td>{item.amount}</td>
                          <td>{item.transaction_category}</td>
                          <td>{item.details}</td>
                        </tr>)
                  }})}
                </tbody>
              </table>
              <Message color='green' style={{padding:"10px"}}><strong>Total : </strong> <span style={{marginLeft:"1%"}}><strong>{totalAmount}</strong></span></Message>  
              <Paginate
              handlePagination={this.handlePagination}
              pageSet={{ activePage, totalPages, per_page }}></Paginate>
            </div>
          </Grid.Column>
        </Grid>
      </React.Fragment>
    )
  }
}
export default withRouter(Transections);

