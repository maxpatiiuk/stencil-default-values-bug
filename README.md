# Stencil Initialization bug

## Description

Given the following code in the component:

```ts
  @Element() el!: HTMLElement;
  name = this.el.tagName;

  @Prop() a: string = 'a';
  b = this.a;
```

Under TypeScript target ES2021, the compiled code looks like this:

```ts
  constructor(hostRef) {
      registerInstance(this, hostRef);
      this.name = this.el.tagName;
      this.b = this.a;
      this.a = 'a';
  }
```

However, under TypeScript target ES2022, the compiled code looks like this:

```ts
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.a = 'a';
    }
    get el() { return getElement(this); }
    name = this.el.tagName;
    b = this.a;
```

Notice that `this.el` and `this.a` is accessed in default values. These are
called before `registerInstance(this, hostRef);` is called. That causes a
crash:

```ts
// when accessing this.el
TypeError: Cannot read properties of undefined (reading '$hostElement$')
// when accessing a prop/value
TypeError: Cannot read properties of undefined (reading '$instanceValues$')
```

## Reproduction

```bash
git clone https://github.com/maxpatiiuk/stencil-initialization-bug
cd stencil-initialization-bug
npm install
```

and run:

```bash
# Using ES2022
npx stencil build --dev --watch --serve
```

See error in the console.

Works when using ES2021:

```bash
# Using ES2021
npx stencil build --dev --watch --serve --config stencil.config.works.ts
```

## Possible Solutions

1. Make component extend a class like this:

   ```ts
   class BaseComponent {
     constructor(hostRef) {
       registerInstance(this, hostRef);
     }
   }
   ```

   This way, the `registerInstance` is called before the default values are
   accessed.

2. Since Stencil uses a compiler, it could modify the code at compile stage to
   not use the default arguments syntax (in favor of setting everything inside
   the constructor)

3. Since Stencil uses a compiler, it could call `registerInstance` in a default
   value. I.e. turn code like this:

   ```ts
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.a = 'a';
    }
    get el() { return getElement(this); }
    name = this.el.tagName;
    b = this.a;
   ```

   into this:

   ```ts
   constructor(hostRef) {
       this.a = 'a';
   }
   get el() { return getElement(this); }
   name = (registerInstance(this, hostRefGlobal), this.el.tagName);
   b = this.a;
   ```

   (where hostRefGlobal would be a global variable set temporary right before
   the component is created - or better yet, could temporarily set the variable on
   the constructor's instance)

Not directly related, but if Stencil Compiler could keep the order of
properties/props/states in the final output the same as it is in the original
source code would be nice (otherwise, this is confusing behavior for the
developer).
