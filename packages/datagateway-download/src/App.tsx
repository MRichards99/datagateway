import React, { Component } from 'react';
import * as log from 'loglevel';

import DownloadTabs from './downloadTab/downloadTab.component';

import {
  createGenerateClassName,
  StylesProvider,
} from '@material-ui/core/styles';
import ConfigProvider from './ConfigProvider';
import { DGThemeProvider } from 'datagateway-common';

const generateClassName = createGenerateClassName({
  productionPrefix: 'dgwd',

  // Only set disable when we are in production and not running e2e tests;
  // ensures class selectors are working on tests.
  disableGlobal:
    process.env.NODE_ENV === 'production' && !process.env.REACT_APP_E2E_TESTING,
});

class App extends Component<unknown, { hasError: boolean }> {
  public constructor(props: unknown) {
    super(props);
    this.state = { hasError: false };
  }

  public componentDidCatch(error: Error | null): void {
    this.setState({ hasError: true });
    log.error(`datagateway-download failed with error: ${error}`);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error">
          <div
            style={{
              padding: 20,
              background: 'red',
              color: 'white',
              margin: 5,
            }}
          >
            Something went wrong...
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <StylesProvider generateClassName={generateClassName}>
          <DGThemeProvider>
            <ConfigProvider>
              <DownloadTabs />
            </ConfigProvider>
          </DGThemeProvider>
        </StylesProvider>
      </div>
    );
  }
}

export default App;
