import { Component, Prop, h, Element } from '@stencil/core';

@Component({
  tag: 'my-component',
  shadow: true,
})
export class MyComponent {
  @Element() el!: HTMLElement;
  name = this.el.tagName;

  @Prop() a: string = 'a';
  b = this.a;

  render() {
    return (
      <div>
        {this.b} {this.name}
      </div>
    );
  }
}
