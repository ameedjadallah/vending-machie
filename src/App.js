import React from "react";
import "./App.scss";
import _ from "lodash";
// components
import Product from "./components/Product";
import SelectionPanel from "./components/SelectionPanel";

const productsResponse = require("./data/productsResponse.json");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      vendingId: 12,
      vendingType: "Snack",
      productsList: [],
      selectionPanel : React.createRef()
    };
  }

  componentDidMount = () => {
    this.getVendingProducts();
  };

  getVendingProducts = () => {
    // get products list
    this.setState({ productsList: productsResponse });
  };

  dispenseProduct = (itemData) => {

    const state = this.state;

    let selectedRow = _.filter(
      state.productsList,
      _.flow(
        _.property("rowProducts"),
        _.partialRight(_.some, { code: parseInt(itemData.itemCode) })
      )
    )[0];

    let selectedRowIndex = _.findIndex(
      state.productsList,
      _.flow(
        _.property("rowProducts"),
        _.partialRight(_.some, { code: parseInt(itemData.itemCode) })
      )
    );

    let seletedProductIndex = null;

    if (selectedRow) {
      seletedProductIndex = _.findIndex(selectedRow.rowProducts, (item) => {
        return item.code === parseInt(itemData.itemCode);
      });
    }

    this.updateProductQuantity(selectedRowIndex, seletedProductIndex);
  };

  checkAvailability = (itemData) => {
    // get seleted info and check if the item with entered quantity is availably
    const state = this.state;

    let selectedRow = _.filter(
      state.productsList,
      _.flow(
        _.property("rowProducts"),
        _.partialRight(_.some, { code: parseInt(itemData.itemCode) })
      )
    )[0];

    let seletedProduct = {}
    if (selectedRow) {
      seletedProduct = _.filter(selectedRow.rowProducts, (item) => {
        return item.code === parseInt(itemData.itemCode);
      })[0];
    }
    state.selectionPanel.current.displaySelectedItemInfo(seletedProduct);
  };

  updateProductQuantity = (selectedRowIndex , seletedProductIndex) => {
    let productsList = this.state.productsList;
    productsList[selectedRowIndex].rowProducts[seletedProductIndex].quantity-=1;
    this.setState({productsList : productsList});
  };

  render() {
    const state = this.state;

    return (
      <div className="vending-machine-app">
        <div className="machine-products">
          {state.productsList.map((row, rowIndex) => {
            return (
              <div className="row-items" key={rowIndex}>
                {row.rowProducts.length !== 0 &&
                  row.rowProducts.map((product, productIndex) => {
                    return <Product product={product} key={productIndex} />;
                  })}
              </div>
            );
          })}
        </div>
        <SelectionPanel
          onSubmit={this.dispenseProduct}
          checkAvailability={this.checkAvailability}
          ref={state.selectionPanel}
        />
      </div>
    );
  }
}

export default App;
