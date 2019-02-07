import ComponentManager from "./component-manager";
import {
  ComponentCapabilities,
  ProgramSymbolTable,
  ComponentDefinition
} from "@glimmer/interfaces";
import { ComponentFactory } from "./component";
import { CAPABILITIES as capabilities } from "./capabilities";

export interface DefinitionState {
  /* Manager-related */
  capabilities: ComponentCapabilities;

  /* Component-related */
  name: string;
  ComponentClass: any;
  handle: number;
  symbolTable?: ProgramSymbolTable;
}

export default class ComponentDefinitionImpl implements ComponentDefinition {
  state: DefinitionState;
  constructor(
    public name: string,
    public manager: ComponentManager,
    public ComponentClass: ComponentFactory,
    public handle: number
  ) {
    this.state = {
      name,
      capabilities,
      ComponentClass,
      handle
    };
  }

  toJSON() {
    return { GlimmerDebug: `<component-definition name="${this.name}">` };
  }
}
