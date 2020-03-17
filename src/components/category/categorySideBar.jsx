import React, { Component } from "react";
import {Icon, Table, Header, Button } from "semantic-ui-react";


export default class categorySideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data,
      child: [],
      children: false
    };
  } 

  itemClicked = item => (event) => {
    if (item.children.length > 0) {
      this.generateChildern(item)
    }
  }

  generateChildern = (item) => {
    let arr = [];
    let name = "";
    let childern = true

    if (item.open) {
      childern = false
    }
    let { data } = this.state 
    if ( data.length > 0 ) {
      data.forEach( cat => {
        if (cat.id !== item.id && cat.open) cat.open = false

        name = cat.id === item.id && !item.open ? "angle down" : "angle right" 
        arr.push(
          <Table.Row key={cat.id} onClick={this.itemClicked(cat)} style={{cursor:'pointer'}}>
            <Table.Cell>
              <Header as='h4'>
                <Header.Content as="a" > <Icon name={name}></Icon> {cat.name}  </Header.Content>
              </Header>
            </Table.Cell>
          </Table.Row>
        )

        if (cat.id === item.id && cat.children.length > 0 ) { 
          if (!childern) {
            cat.open = false
          } 
          else {
            cat.open = true;
            cat.children.forEach( child => {
              arr.push(
                <Table.Row key={child.id} onClick={this.itemClicked(child)} style={{cursor:'pointer', width: '75%'}}>
                  <Table.Cell>
                    <Header as="h4">
                      <Header.Content  as="a" ><Icon color="brown" name="angle double right"></Icon><span style={{ color: "#B5651D" }} > {child.name} </span></Header.Content>
                    </Header>
                  </Table.Cell>
                </Table.Row>
              )
            })
          }
        }
      })
      this.setState({ renderData: arr, children: true })
    }
  }

  generateCategoryList = (data, id) => {
    let arr = [];

    if (data.length > 0) { 
    
      data.forEach((item)=>{
      
        arr.push(
          <Table.Row key={item.id} onClick={this.itemClicked(item)} style={{cursor:'pointer'}}>
            <Table.Cell>
              <Header as='h4'>
                <Header.Content as="a" > <Icon name="angle right"></Icon> {item.name}  </Header.Content>
              </Header>
            </Table.Cell>
          </Table.Row>
        ) 
      }) 

    }
    return arr;
  }
  gotoHome = () =>{
    this.props.gotoHome();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState({ data: this.props.data })
    }
  } 
   
  render() {
    const { data } = this.state

    return (
      <div style={data.length>0?{ marginTop:"6%"}:{ marginTop:"20%"}}>
          {/* {data.length > 0 ?
          <div>
            <Button primary floated='left' onClick={this.gotoHome}>
              <Icon name='left chevron' />
              Home
            </Button>
          </div>
          :null
          } */}
          <Table celled padded >
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Categories</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>{ this.state.children ? this.state.renderData : this.generateCategoryList(data) }</Table.Body>
        </Table>
      </div>

    )
  }
}
