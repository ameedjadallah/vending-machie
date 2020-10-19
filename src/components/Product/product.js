import React from "react";

class Product extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      product: null,
    };
  }

  componentDidMount = () => {
    this.getProduct();
  };

  getProduct = () => {
    this.setState({ product: this.props.product });
  };

  render() {
    const product = this.state.product;
    return (
      <div className="product-item">
        {this.state.product !== null && (       
          <div className="item-info">
            <div className="product-image">
              <img src={require(`../../assets/images/${product.image}`)} alt={'product'}/>
            </div>
            <div className="product-code">#{product.code}</div>
          </div>
        )}
      </div>
    );
  }
}

export default Product;
