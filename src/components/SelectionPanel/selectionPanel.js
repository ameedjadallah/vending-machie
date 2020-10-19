import React from "react";
import _ from "lodash";
const moneyTypesResponse = require("../../data/moneyTypesResponse.json");

class SelectionPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      itemCode: "",
      amount: "",
      moneyType: "c",
      paymentMethod: "cash",
      selectedItem: {},
      isEnteredMoneyValid: false,
      moneyTypes: [],
      warningMessage: "",
      denominationsArray: [],
      error: false,
    };
  }

  componentDidMount = async () => {
    await this.getAcceptedMoney();
  };

  getAcceptedMoney = () => {
    this.setState({
      moneyTypes: _.orderBy(moneyTypesResponse, ["value"], ["desc"]),
    });
  };

  handleChange = async (evt) => {
    const value = evt.target.value;
    const name = evt.target.name;
    this.setState({ warningMessage: "" });

    await this.setState({
      [evt.target.name]: value,
    });

    if (name === "itemCode") {
      this.checkProductAvailability();
    } else if (name === "amount" || name === "moneyType") {
      this.validateEnteredMoney();
    }
  };

  buyItem = () => {
    const state = this.state;
    let dataToSend = {
      itemCode: state.itemCode,
      amount: state.amount,
      moneyType: state.moneyType,
      paymentMethod: state.paymentMethod,
    };

    if (this.state.error) {
      this.setState({
        warningMessage: "There is an error while trying to buy",
      });
      return;
    }
    // dispense product
    this.props.onSubmit(dataToSend);

    // dispense coin
    this.dispenseCoin();
    // reset panel fields
    this.resetAllFields();
  };

  dispenseCoin = () => {
    const state = this.state;

    let moneyTypes = state.moneyTypes;
    let amount =
      state.moneyType === "d"
        ? parseInt(state.amount) * 100
        : parseInt(state.amount);

    _.forEach(moneyTypes, (coin, index) => {
      // check if system return money from this coin
      let isAffected = _.find(state.denominationsArray, (item) => {
        return item.note === coin.value;
      });
      if (isAffected) {
        moneyTypes[index].quantity -= isAffected.count;
      }

      // add the entered coin to the machine capacity
      if (coin.value === amount) {
        coin.quantity++;
      }
    });

    this.setState({ moneyTypes: moneyTypes });
  };

  checkProductAvailability = () => {
    const state = this.state;
    let dataToSend = {
      itemCode: state.itemCode,
    };
    this.props.checkAvailability(dataToSend);
  };

  displaySelectedItemInfo = async (item) => {
    await this.setState({ selectedItem: item });
    await this.setState({
      error: !this.state.selectedItem.quantity ? true : false,
    });
  };

  validateEnteredMoney = () => {
    const state = this.state;
    let amount = state.moneyType === "d" ? state.amount * 100 : state.amount;
    let isValid = _.filter(state.moneyTypes, (coin) => {
      return coin.value === parseInt(amount);
    })[0];

    if (isValid && state.selectedItem && state.selectedItem.quantity) {
      this.acceptEnteredMoney(isValid);
      this.setState({
        error: false,
      });
    } else {
      this.setState({
        error: true,
      });
    }
  };

  acceptEnteredMoney = (isValid) => {
    const state = this.state;

    // check if entered money is more than or equal product price
    let enteredMoney = isValid.value;
    let productMoney = state.selectedItem.price;
    if (productMoney > enteredMoney) {
      // show message that the entered money is not enough
      this.setState({ warningMessage: "Your entered money is not enough" });
    } else {
      // determines if any change should be sent back to customer.
      if (enteredMoney > productMoney) {
        this.calculateNoteDispense(enteredMoney - productMoney);
      }
    }
  };

  calculateNoteDispense = async (amount) => {
    const state = this.state;

    let numericAmount = parseInt(amount);
    let checkCapacity = 0;
    let tempCount = [];
    let resultArray = [];
    await _.forEach(state.moneyTypes, (note, index) => {
      if (note.quantity > 0 && numericAmount >= note.value) {
        tempCount[index] = Math.floor(numericAmount / note.value);
        if (tempCount[index] > note.quantity) {
          tempCount[index] = note.quantity;
        }

        checkCapacity += tempCount[index] * note.value;
        numericAmount = numericAmount - tempCount[index] * note.value;
      }
    });

    if (checkCapacity !== parseInt(amount)) {
      this.setState({
        warningMessage: "There is no enough money to return back",
      });

      return;
    }

    await _.forEach(state.moneyTypes, (note, index) => {
      if (tempCount[index]) {
        resultArray.push({ count: tempCount[index], note: note.value });
      }
    });
    this.setState({ denominationsArray: resultArray });
  };

  resetAllFields = () => {
    this.setState({
      itemCode: "",
      amount: "",
      moneyType: "c",
      paymentMethod: "cash",
      selectedItem: null,
      isEnteredMoneyValid: false,
      warningMessage: "",
    });
  };

  render() {
    const state = this.state;

    return (
      <div className="selection-panel">
        <div className="panel-screen">
          <div className="welcome-message">Welcome :)</div>
          <div className="order-summery">
            {state.itemCode &&
              state.selectedItem &&
              !!state.selectedItem.quantity && (
                <div>
                  your selection is available <br /> with const{" "}
                  {state.selectedItem.price / 100 < 1
                    ? "¢" + state.selectedItem.price
                    : "$" + state.selectedItem.price / 100}
                </div>
              )}

            {state.selectedItem && state.selectedItem.quantity === 0 && (
              <div className="warning-message">
                This item code is not valid or empty
              </div>
            )}

            {state.warningMessage && (
              <div className="warning-message">{state.warningMessage}</div>
            )}

            {state.selectedItem === null &&
              state.denominationsArray.length !== 0 && (
                <div className="success-message">
                  <h5>Receive the product and get the rest of the money</h5>
                  {state.denominationsArray.map((note, index) => {
                    return (
                      <div className="note-item" key={index}>
                        {note.count} X{" "}
                        {note.note / 100 < 1
                          ? "¢" + note.note
                          : "$" + note.note / 100}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
        <div className="fields-list">
          <input
            type="number"
            className="input-field"
            placeholder="Item Number"
            value={state.itemCode}
            name="itemCode"
            onChange={this.handleChange.bind(this)}
          />
          <select
            className="input-field select"
            name="paymentMethod"
            value={state.paymentMethod}
            onChange={this.handleChange.bind(this)}
          >
            <option value="cash">Cash</option>
            <option value="credit">Credit Card</option>
          </select>
          <div
            className={`input-group ${
              state.paymentMethod !== "cash" ? "disabled" : ""
            }`}
          >
            <input
              type="number"
              className="input-field"
              placeholder="Amount"
              value={state.amount}
              onChange={this.handleChange.bind(this)}
              name="amount"
            />
            <select
              className="input-field select"
              value={state.moneyType}
              onChange={this.handleChange.bind(this)}
              name="moneyType"
            >
              <option value="c">¢</option>
              <option value="d">$</option>
            </select>
          </div>

          <button className="btn make-order" onClick={this.buyItem.bind(this)}>
            Buy
          </button>
        </div>
      </div>
    );
  }
}

export default SelectionPanel;
