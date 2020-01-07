import React, { Component } from 'react';
import * as log from 'loglevel';
// import DownloadCartTable from './downloadCart/downloadCartTable.component';
import {
  createGenerateClassName,
  StylesProvider,
} from '@material-ui/core/styles';
import DownloadTabs from './downloadTab.component';

// import DownloadStatusTable from './downloadStatus/downloadStatusTable.component';

const generateClassName = createGenerateClassName({
  productionPrefix: 'dgwd',
});

class App extends Component<{}, { hasError: boolean }> {
  public constructor(props: {}) {
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
          {/* <DownloadStatusTable /> */}
          <DownloadTabs />
          {/* <DownloadCartTable /> */}
        </StylesProvider>
      </div>
    );
  }
}

export default App;
