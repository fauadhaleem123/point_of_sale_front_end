import React, { Component } from "react";
import { Button, Modal, Form, Dropdown, Message } from "semantic-ui-react";
import http from "../../services/httpService.js";
import { apiUrl } from "../../utils/api-config";

let itemList = []

class EditItem extends Component {
  constructor(props){
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
            size_attributes: { size_type: "" }
          }
        ],
        sizeOptions: []
      };
  }

  setDefaultState = props => {
    const { name , category } = props
    const item_sizes_attributes = props.item_sizes_attributes;
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
    this.createOptions(this.props.data);
    this.createSizesOptions();
  };



  createSizesOptions = () => {
    let sizeOptions = [];
    const { sizes } = this.props;
    if (sizes && sizes.length > 0) {
      sizes.forEach(size => {
        sizeOptions.push({
          key: size.id,
          text: size.size_type,
          value: size.size_type
        });
      });
    }
    this.setState({ sizeOptions });
  };

  createOptions = options => {
    let penalArray = [];
    if (options && options.length > 0) {
      options.forEach(data => {
        penalArray.push({ key: data.id, text: data.name, value: data.name });
      });
    }
    this.setState({ categoryOptions: penalArray });
    this.createDropDown(penalArray);
  };

  createDropDown = opt => {
    if (opt.length > 0) {
      let dropdown = (
        <Dropdown
          placeholder="category"
          fluid
          selection
          key={Math.random()}
          options={opt}
          defaultValue={this.state.category}
          onChange={this.handleChange}
        />
      );
      this.state.dropDownList.push(dropdown);
      this.setState({ state: this.state });
    }
  };

  handleChange = (e, { value }) => {
    this.setState({ value });
    this.updateCategoryOptions(value);
  };

  updateCategoryOptions = ({ value }) => {
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
      this.setState({
        categoryObjID: objCategory.id
      });
      this.createOptions(itemList);
    }
  };

  show = () => {
    this.setState({ open: true });
    itemList = this.props.data;
    this.state.ancestorOptions.push(itemList);
    this.createOptions(this.props.data);
    this.createSizesOptions();
  };

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
                  placeholder="Item name"
                  name="name"
                  onChange={this.onChange}
                  value={name}
                  // value = {itemData}
                  required
                />

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
                      value={item_sizes_attributes[index][name]}
                      required
                    />
                    {/* {console.log(item, " :item_size_attributes")} */}
                    <Form.Field required>
                      <label>Size</label>
                      <Dropdown
                        placeholder="Size"
                        name="size_type"
                        id={"size-" + index}
                        fluid
                        value={
                          item_sizes_attributes[index]["size_attributes"][name]
                        }
                        clearable
                        options={sizeOptions}
                        onChange={event => this.handleSizeChange(event, index)}
                        selection
                      />
                    </Form.Field>
                    <Form.Input
                      fluid
                      label="Price"
                      placeholder="Item price"
                      type="number"
                      name="price"
                      id={"price-" + index}
                      value={item_sizes_attributes[index][name]}
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
                      value={item_sizes_attributes[index][name]}
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
                        value={item_sizes_attributes[index]["name"]}
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
                onClick={itemData ? this.editItem : this.addItem}
              />
            </Modal.Actions>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

export default EditItem;