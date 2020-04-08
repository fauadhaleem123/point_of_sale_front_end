import React, { Component } from "react";
import {
  Card,
  Image,
  Grid,
  Container,
  Header,
  Segment,
  Label,
  Divider
} from "semantic-ui-react";
import { BreakpointProvider, Breakpoint } from "react-socks"
import { Link } from "react-router-dom";
import StockByCategoryChart from "../charts/stockByCategoryChart";
import SalesByCategoryChart from "../charts/salesByCategoryChart";
import LastWeekSalesChart from "../charts/lastWeekSalesChart";
import ItemsStockChart from "../charts/itemsStockChart";
import "./style.css"

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = { width: 0, height: 0 };
  }
  
  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }
  
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }
  
  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }
  
  render() { 
    let width = this.state.width < 1000 ? 10 : 8; 
    let bool = this.state.width < 1000 ? true: false;
   
    return (
      <React.Fragment>
        <Container className="page-header">
          <Header as="h2" className="second-header" floated="right">
            <span className="home_header">Devsinc</span>
          </Header>
          <Header as="h2" className="home_header" floated="left">
            <Image
              className="logo"
              src={require("../../images/company_icon.jpeg")}
            />
            <span className="header-text home_header">Dashboard</span>
          </Header>
        </Container>
        <div className="ui divider"></div>
        <BreakpointProvider>
          <Breakpoint large up>
          <Grid centered columns={5} className="card-contatiner">
          <Grid.Row>
            { this.props.role === "read_and_write" &&
              <Grid.Column>
                <Link to="/reciept">
                  <Card raised className="card-div">
                    <Image
                      src={require("../../images/invoice.jpg")}
                      wrapped
                      ui={false}
                    />
                    <Card.Content>
                      <Card.Header className="card-heading">
                        New Invoice
                      </Card.Header>
                    </Card.Content>
                  </Card>
                </Link>
              </Grid.Column>
            }
            <Grid.Column>
              <Link to="/inventory">
                <Card raised className="card-div">
                  <Image
                    src={require("../../images/inventory.jpg")}
                    wrapped
                    ui={false}
                  />
                  <Card.Content>
                    <Card.Header className="card-heading">
                      Item Inventory
                    </Card.Header>
                  </Card.Content>
                </Card>
              </Link>
            </Grid.Column>
            <Grid.Column>
              <Link to="/reports">
                <Card raised className="card-div"> 
                  <Image
                    src={require("../../images/reports.jpeg")}
                    wrapped
                    ui={false}
                  />
                  <Card.Content>
                    <Card.Header className="card-heading">
                      Sale Reports
                    </Card.Header>
                  </Card.Content>
                </Card>
              </Link>
            </Grid.Column>
            <Grid.Column>
              <Link to="/stock_report">
                <Card raised className="card-div">
                  <Image
                    src={require("../../images/stock_report.jpg")}
                    wrapped
                    ui={false}
                  />
                  <Card.Content>
                    <Card.Header className="card-heading">
                      Stock Report
                    </Card.Header>
                  </Card.Content>
                </Card>
              </Link>
            </Grid.Column>
            <Grid.Column>
              <Link to="/accounts">
                <Card raised className="card-div">
                  <Image
                    src={require("../../images/accounts.jpg")}
                    wrapped
                    ui={false}
                  />
                    <Card.Content>
                      <Card.Header className="card-heading">
                        Accounts
                      </Card.Header>
                    </Card.Content>
                  </Card>
                </Link>
              </Grid.Column>
            </Grid.Row>
          </Grid>
          </Breakpoint>
        </BreakpointProvider>
        <Divider horizontal className="card-divider"><span className="divider">Sale Statistics</span></Divider>
        <Grid centered>
          { width === 8 && 
          <Grid.Row>
            <Grid.Column width="8">
              <Segment raised>
                <Label ribbon size="big" color="blue">
                  <span className="chart_header">Stock By Category</span>
                </Label>
                <StockByCategoryChart />
              </Segment>
            </Grid.Column>
            <Grid.Column width="8" >
              <Segment raised>
                <Label ribbon size="big" color="blue">
                <span className="chart_header">Sales By Category</span>
                </Label>
                <SalesByCategoryChart />
              </Segment>
            </Grid.Column>
            <Grid.Column></Grid.Column>
          </Grid.Row> }
          { width === 10 &&
            <>
            <Grid.Row stretched>
              <Grid.Column width="12" style={{margin: "auto"}}>
                <Segment raised>
                  <Label size="big" color="blue" ribbon>
                    <span className="chart_header">Stock By Category</span>
                  </Label>
                  <StockByCategoryChart width={bool} />
                </Segment>
              </Grid.Column>
            </Grid.Row> 
            <Grid.Row>
              <Grid.Column width="12" style={{margin: "auto"}}>
                <Segment raised>
                  <Label size="big" color="blue" ribbon>
                    <span className="chart_header">Sales By Category</span>
                  </Label>
                  <SalesByCategoryChart width={bool} />
                </Segment>
              </Grid.Column>
            </Grid.Row> 
           </>
          }
            <Grid.Row>
            <Grid.Column width="12" style={{margin: "auto"}}>
              <Segment raised>
                <Label size="big" color="blue" ribbon>
                <span className="chart_header">Last Week Sales</span>
                </Label>
                <LastWeekSalesChart />
              </Segment>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row stretched>            
            <Grid.Column width="12" style={{margin: "auto"}}>
              <Segment raised>
                <Label size="big" color="blue" ribbon>
                <span className="chart_header">Products Available Stock</span>
                </Label>
                <ItemsStockChart />
              </Segment>
            </Grid.Column>
            </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  }
}

export default Home;
