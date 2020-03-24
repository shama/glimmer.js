import { module, test, render, settled } from '../utils';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@glimmer/helper';
import { on, action } from '@glimmer/modifier';

import { setComponentTemplate, createTemplate, templateOnlyComponent } from '@glimmer/core';

module('[@glimmer/core] interactive - {{fn}}', () => {
  test('can curry arguments via fn', async function(assert) {
    assert.expect(9);

    let helloWorldComponent: HelloWorld;
    let passedMsg1, passedMsg2, passedEvent: MouseEvent | undefined;

    class HelloWorld extends Component {
      @tracked
      name = 'world';

      constructor(owner: unknown, args: {}) {
        super(owner, args);
        helloWorldComponent = this;
      }

      @action
      userDidClick(msg1: string, msg2: string, event: MouseEvent): void {
        passedMsg1 = msg1;
        passedMsg2 = msg2;
        passedEvent = event;
        assert.strictEqual(this, helloWorldComponent, 'function context is preserved');
      }
    }

    setComponentTemplate(
      HelloWorld,
      createTemplate(
        { on, fn },
        '<button {{on "click" (fn this.userDidClick "hello" this.name)}}>Hello World</button>'
      )
    );

    const output = await render(HelloWorld);

    assert.strictEqual(output, '<button>Hello World</button>');

    const element = document.getElementById('qunit-fixture')!;
    const button = element.querySelector('button')!;
    button.click();

    assert.strictEqual(passedMsg1, 'hello');
    assert.strictEqual(passedMsg2, 'world');
    assert.ok(passedEvent instanceof MouseEvent);
    passedEvent = undefined;

    helloWorldComponent!.name = 'cruel world';

    await settled();

    button.click();

    assert.strictEqual(passedMsg1, 'hello');
    assert.strictEqual(passedMsg2, 'cruel world');
    assert.ok(passedEvent! instanceof MouseEvent);
  });

  test('functions can be curried multiple times', async function(assert) {
    assert.expect(2);

    let parentComponent: ParentComponent;
    let passed: Array<number | Event> = [];

    class ParentComponent extends Component {
      name = 'world';

      constructor(owner: unknown, args: {}) {
        super(owner, args);
        parentComponent = this;
      }

      @action
      userDidClick(a1: number, a2: number, a3: number, a4: number, a5: number, a6: number): void {
        passed = [a1, a2, a3, a4, a5, a6];
        assert.strictEqual(this, parentComponent, 'function context is preserved');
      }
    }

    const Grandchild = templateOnlyComponent();
    setComponentTemplate(
      Grandchild,
      createTemplate({ on, fn }, '<button {{on "click" (fn @userDidClick 5 6)}}></button>')
    );

    const Child = templateOnlyComponent();
    setComponentTemplate(
      Child,
      createTemplate(
        { Grandchild, fn },
        '<div><Grandchild @userDidClick={{fn @userDidClick 3 4}} /></div>'
      )
    );

    setComponentTemplate(
      ParentComponent,
      createTemplate({ Child, fn }, '<div><Child @userDidClick={{fn this.userDidClick 1 2}} /></div>')
    );

    await render(ParentComponent);

    const element = document.getElementById('qunit-fixture')!;
    const button = element.querySelector('button')!;

    button.click();

    assert.deepEqual(passed, [1, 2, 3, 4, 5, 6]);
  });

  test('action helper invoked without a function raises an error', function(assert) {
    class Parent extends Component {}

    setComponentTemplate(
      Parent,
      createTemplate({ on, fn }, '<button {{on "click" (fn this.doesntExist)}}></button>')
    );

    assert.rejects(render(Parent), /fn must receive a function as its first parameter/);
  });

  test('fn helper invoked without a parameter raises an error', function(assert) {
    class Parent extends Component {
      @action
      exists(): void {
        assert.ok(false, 'this shouldnt run');
      }
    }

    setComponentTemplate(
      Parent,
      createTemplate({ on, fn }, '<button {{on "click" (fn this.exists)}}></button>')
    );

    assert.rejects(render(Parent), /fn must receive at least one argument to pass to the function, otherwise there is no need to use fn./);
  });
});

