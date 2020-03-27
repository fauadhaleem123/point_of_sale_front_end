import React, { Component } from "react";
import { Button, Modal, Form, Dropdown, Message } from "semantic-ui-react";
import SearchSize from "./searchsize"
import http from "../../services/httpService.js";
import { apiUrl } from "../../utils/api-config";

var itemList = [];

export default class AddItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      display: false,
      name: "",
      category: "",
      categoryOptions: [],
      dropDownList: [],
      ancestorOptions: [],
      item_sizes_attributes: [
        {
          code: "",
          discount: 0,
          quantity: 0,
          price: 0,
          size_attributes: { size_type: "", id: "" }
        }
      ],
      sizeOptions: []
    };
  }

  initialState = (afterEdit) => {
    if (afterEdit){
      this.setState({
        open: false,
        display: false,
        dropDownList: [],
        ancestorOptions: []
      });
    } else {
      this.setState({
        open: false,
        display: false,
        name: "",
        item_sizes_attributes: [
          {
            code: "",
            discount: 0,
            quantity: 0,
            price: 0,
            size_attributes: { size_type: "" }
          }
        ],
        category: "",
        categoryObjID: "",
        categoryOptions: [],
        dropDownList: [],
        ancestorOptions: []
      });
    }
  };

  setDefaultState = props => {
    let newProps ={};
    newProps.item_sizes_attributes = [];
    newProps.item_sizes_attributes = props.item_sizes_attributes.map( a => {
      let x = {}
      const { id, code, price, quantity, discount, size_attributes } = a;
      x.id = id;
      x.code = code;
      x.price = price;
      x.quantity = quantity;
      x.discount = discount;
      x.size_attributes = { ...size_attributes }
      return x;
    });

    const { name , category } = props
    const item_sizes_attributes = newProps.item_sizes_attributes;
      
    this.setState({
      name,
      category,
      item_sizes_attributes
    });
  };

  show = () => {
    this.setState({ open: true });
    itemList = this.props.data;
    this.state.ancestorOptions.push(itemList);
    this.createOptions(this.props.data, this.props.check);
    this.createSizesOptions();
  };

  close = () => { this.initialState() }

  cancel = key => {
    if (key === "add") this.initialState();
    else {
      this.setState({
        open: false,
        display: false,
        dropDownList: [],
        ancestorOptions: []
      });
    }
  };

  checkingPrevious = async itemName => {
    let response;
    let bool = true
    let page;
    page = 1;
    let i;
    while (bool) {
      response = await http.get(`${apiUrl}/api/v1/items/`, {params: { page }})

      for ( i = 0; i < response.data.items.length; i++){
        if (itemName === response.data.items[i].name){
         
          this.setState({
            id: response.data.items[i].id,
            name: response.data.items[i].name,
            category: response.data.items[i].category,
            item_sizes_attributes: response.data.items[i].item_sizes_attributes,
            dropDownList: []
          },() => this.createOptions(this.props.data, true) )

          bool = false;
        }
      }
      
      if (page < response.data.pages){
        page = page + 1;
      } else {
        bool = false;
      }
    }
  }
  

  onChange = e => {
    if(e.target.name === "name"){
      this.checkingPrevious(e.target.value);
    }
    if (["code", "discount", "quantity", "price"].includes(e.target.name)) {
      let item_sizes_attributes = [...this.state.item_sizes_attributes];
      item_sizes_attributes[e.target.id.slice(-1)][e.target.name] =
        e.target.value;
      this.setState({ item_sizes_attributes });
    } else {
      this.setState({ [e.target.name]: e.target.value });
    }
  };

  handleChange = (e,  { value } ) => {
    this.setState({ value });
    this.updateCategoryOptions(value);
  };

  handleSizeChange = (event, index) => {
    
    let element
    if (event.target.firstElementChild){
      element = event.target.firstElementChild;
    } else {
      element = event.target;
    }
    
    const item_sizes_attributes = [...this.state.item_sizes_attributes];
    const size_attributes = {
      ...item_sizes_attributes[index].size_attributes
    };
    size_attributes.size_type = element.textContent;
    item_sizes_attributes[index]["size_attributes"] = size_attributes;
    this.setState({ item_sizes_attributes });
  };

  handleSizeChangeSearch = (value, index) => {
    console.log(this.state.item_sizes_attributes, " :this.state.item_sizes_attributes")

    const item_sizes_attributes = [...this.state.item_sizes_attributes];
    const size_attributes = {
      ...item_sizes_attributes[index].size_attributes
    }
    size_attributes.size_type = value;
    item_sizes_attributes[index]["size_attributes"] = size_attributes;
    this.setState({ item_sizes_attributes }, () => console.log(this.state.item_sizes_attributes, " :Wellelele"));
  }

  beforeAdd = async () => {
    const { item_sizes_attributes } = this.state

    let sizeOptions = [];
    sizeOptions = this.state.sizeOptions.map( size => size.title)
    let isSizeAvailable;

    for ( let i = 0; i < item_sizes_attributes.length; i++) {
      
      isSizeAvailable = sizeOptions.includes(item_sizes_attributes[i].size_attributes.size_type)
      if (!isSizeAvailable) {
        await http.post(`${apiUrl}/api/v1/sizes`, {
          size_type: item_sizes_attributes[i].size_attributes.size_type
        })        
      } 
    }
    this.props.fetchSizes();

    if (!this.state.categoryObjID) {
      this.updateCategoryOptions(this.state.category,null,true)
    }

    this.addItem();
  }

  addItem = () => {
    const { name, categoryObjID, item_sizes_attributes } = this.state;
    
    if (name && categoryObjID && item_sizes_attributes) {
      http
        .post(`${apiUrl}/api/v1/items`, {
          name: name,
          category_id: categoryObjID,
          item_sizes_attributes
        })
        .then(res => {
          this.props.addItem();
        })
        .catch(error => console.log(error));

      this.initialState();
    } else {
      this.setState({ display: true });
      setTimeout(() => {
        this.setState({ display: false });
      }, 5000);
    }
  };

  // setting categoryObjID before editing as it is undefined
  beforeEdit = async () => {
    const { item_sizes_attributes } = this.state

    let sizeOptions = [];
    sizeOptions = this.state.sizeOptions.map( size => size.title)
    let isSizeAvailable;

    for ( let i = 0; i < item_sizes_attributes.length; i++) {
      
      isSizeAvailable = sizeOptions.includes(item_sizes_attributes[i].size_attributes.size_type)
      if (!isSizeAvailable) {
        await http.post(`${apiUrl}/api/v1/sizes`, {
          size_type: item_sizes_attributes[i].size_attributes.size_type
        })
        
      } 
    }
    this.props.fetchSizes();
    
    this.updateCategoryOptions(this.state.category, true) 
  }

  addSizeOptions = async (size) => {
    try {
        await http.post(`${apiUrl}/api/v1/sizes`, {
        size_type: size
      }) 
    }
    catch (error) {
      console.log(error)
    }
  }

  editItem = (comingFromAdd) => {
    let id;
    if (comingFromAdd) {
      id = this.state.id
    } else {
      id = this.props.itemData.id;
    }
    const { name, categoryObjID, item_sizes_attributes } = this.state
   
    for ( let i=0; i<item_sizes_attributes.length; i++) {
      delete item_sizes_attributes[i].size_attributes.size_id
    } 
    
    
    if (name && categoryObjID && item_sizes_attributes) {
      http
        .put(`${apiUrl}/api/v1/items/${id}`, {
          name: name,
          category_id: categoryObjID,
          item_sizes_attributes
        })
        .then(res => {
          comingFromAdd ? this.props.addItem() : this.props.editItem()
          console.log(res, "  res")
        })
        .catch(error => console.log(error));

      this.initialState(true);
    } else {
      this.setState({ display: true });
      setTimeout(() => {
        this.setState({ display: false });
      }, 5000);
    }
  };
 
  updateCategoryOptions = (value, beforeEdit, beforeAdd) => {
    
    var matchingObj;
    var objCategory;
    var index = 0;
    const { ancestorOptions, dropDownList } = this.state;

    ancestorOptions.forEach((categoryOptions, i) => {
      matchingObj = categoryOptions.find(cat => cat.name === value);
      if (matchingObj) {
        objCategory = matchingObj;
        index = i;
      }
    });
 
    if (objCategory) {
      for (let i = 0; i < dropDownList.length; i++) {
        if (i > index) {
          dropDownList[i] = null;
        }
      }

      this.setState({ state: this.state });

      itemList = objCategory.children;
           
      ancestorOptions.push(itemList);
      if (beforeEdit || beforeAdd) {
        this.setState({
          categoryObjID: objCategory.id
        }, () => this.callEditOrAdd(beforeEdit, beforeAdd));  
      } else {
        this.setState({ categoryObjID: objCategory.id })
      } 
      
      this.createOptions(itemList);
    }
  };

  callEditOrAdd = (edit, add) => {
    if (edit) {
      this.editItem()
    } else if (add) {
      this.editItem(true);
    }
  }

  createOptions = (options, check) => {
    
    let penalArray = [];
    if (options && options.length > 0) {
      options.forEach(data => {
        penalArray.push({ key: data.id, text: data.name, value: data.name });
      });
    }
    this.setState({ categoryOptions: penalArray });
    this.createDropDown(penalArray, check);
    
  };

  createSizesOptions = () => {
    let sizeOptions = [];
    const { sizes } = this.props;
    if (sizes && sizes.length > 0) {
      sizes.forEach(size => {
        sizeOptions.push({
          key: size.id,
          text: size.size_type,
          value: size.size_type,
          title: size.size_type
        });
      });
    }
    this.setState({ sizeOptions });
  };

  createDropDown = (opt,check) => {
    let name = null;
    if (check) {
      let { ancestorOptions } = this.state
      
      let i, j, k;
      let brake = false;

      
      for (i = 0; i < ancestorOptions.length; i++) {
        if (brake){
          break;
        }

        for ( j = 0; j < ancestorOptions[i].length; j++){        
          if ( ancestorOptions[i][j].name === this.state.category ) {
            brake = true;
            break;
          }
          if (ancestorOptions[i][j].children.length > 0) {
            for ( k = 0; k < ancestorOptions[i][j].children.length; k++ ) {
              if ( ancestorOptions[i][j].children[k].name === this.state.category ) {
                name = ancestorOptions[i][j].name
              }
            }
          }
        }
      }
    }
    
    if (opt.length > 0) {
      let dropdown = (
        <Dropdown
          placeholder="category"
          fluid
          selection
          key={Math.random()}
          options={opt}
          defaultValue={name ? name : this.state.category}
          onChange={this.handleChange}
        />
      );

      this.state.dropDownList.push(dropdown);
      this.setState({ state: this.state });
      if (name && check) {
        this.handleChange(null, {value: name})
      }
    }
  };

  addItemSizes = event => {
    event.preventDefault();
    this.setState(prevState => ({
      item_sizes_attributes: [
        ...prevState.item_sizes_attributes,
        {
          code: "",
          discount: 0,
          quantity: 0,
          price: 0,
          size_attributes: { size_type: "" }
        }
      ]
    }));
  };

  removeItemSizes = event => {
    event.preventDefault();
    let item_sizes_attributes = [...this.state.item_sizes_attributes];
    item_sizes_attributes.splice(-1, 1);
    this.setState({ item_sizes_attributes });
  };

  componentDidMount() {
    if (this.props.itemData) {
      this.setDefaultState(this.props.itemData);
    }
  }

  createItemNameList = () => {
    return this.props.items ? this.props.items.map( item => <option value={item.name} />) : null
  }
  
  render() {
    const {
      open,
      display,
      dropDownList,
      name,
      item_sizes_attributes,
      sizeOptions
    } = this.state;

    const { itemData } = this.props;
    
    return (
      <React.Fragment>
        {itemData && (
          <Button color="green" icon="edit" onClick={() => this.show("edit")} />
        )}
        <div className="item">
          {!itemData && (
            <Button id="addItem" onClick={() => this.show("add")} primary>
              Add item
            </Button>
          )}
          <Modal
            className="cat-modal"
            dimmer="blurring"
            open={open}
            onClose={itemData ? this.cancel : this.close}
          >
            <Modal.Header>{itemData ? "Edit Item" : "Add Item"}</Modal.Header>
            <Form className="itemForm">
              <Form.Group widths="2">
                  <Form.Input
                    fluid
                    label="Name"
                    list="languages"
                    placeholder="Item name"
                    name="name"
                    autoComplete="off"
                    onChange={this.onChange}
                    value={name}
                    required
                  />
                  <datalist id='languages'>
                    {this.createItemNameList()}
                  </datalist>
                
                <Form.Field required>
                  <label>Category</label>
                  {dropDownList.map(data => data )}
                </Form.Field>
              </Form.Group>

              {item_sizes_attributes.map((item, index) => {
                return (
                  <Form.Group widths="5" key={index}>
                    <Form.Input
                      fluid
                      label="Code"
                      placeholder="Item code"
                      name="code"
                      id={"code-" + index}
                      onChange={this.onChange}
                      value = {item.code}
                      required
                    />
                    <Form.Field required>
                      <label>Size</label>
                      <SearchSize
                        handleSizeChangeSearch={this.handleSizeChangeSearch}
                        index={index}
                        sizes={sizeOptions}
                        initialState = {{ isLoading: false, value: item.size_attributes.size_type }}
                      />
                    </Form.Field>
                    <Form.Input
                      fluid
                      label="Price"
                      placeholder="Item price"
                      type="number"
                      name="price"
                      id={"price-" + index}
                      value = {item.price}
                      onChange={this.onChange}
                      required
                    />

                    <Form.Input
                      fluid
                      label="Quantity"
                      type="number"
                      placeholder="Item quantity"
                      name="quantity"
                      id={"quantity-" + index}
                      value = {item.quantity}
                      onChange={this.onChange}
                      required
                    />

                    <Form.Field>
                      <Form.Input
                        fluid
                        type="number"
                        label="Discount( % )"
                        placeholder="Discount"
                        name="discount"
                        id={"discount-" + index}
                        value = {item.discount}
                        min="0"
                        max="100"
                        onChange={this.onChange}
                      ></Form.Input>
                    </Form.Field>
                  </Form.Group>
                );
              })}

              <Button color="green" onClick={this.addItemSizes}>
                Add more Size
              </Button>

              {item_sizes_attributes.length > 1 ? (
                <Button color="red" onClick={this.removeItemSizes}>
                  Remove Size
                </Button>
              ) : null}

              {display ? (
                <Message negative>
                  <Message.Header>fields can not be empty</Message.Header>
                  <p>
                    check the fields with red-star, these should not be empty{" "}
                  </p>
                </Message>
              ) : null}
            </Form>

            <Modal.Actions>
              <Button
                color="black"
                onClick={
                  itemData
                    ? () => this.cancel("edit")
                    : () => this.cancel("add")
                }
              >
                Cancel
              </Button>
              <Button
                positive
                icon="checkmark"
                labelPosition="right"
                content={itemData ? "Update" : "Add"}
                onClick={itemData ? () => this.beforeEdit(true) : this.beforeAdd}
              />
            </Modal.Actions>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}
