import React from 'react';
import './App.css';
import * as log from 'loglevel';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';
import AppReducer from './state/reducers/app.reducer';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import { ConnectedRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { Switch, Route, RouteComponentProps } from 'react-router';
import DGTableMiddleware, {
  listenToMessages,
} from './state/middleware/dgtable.middleware';
import { RegisterRouteType } from './state/actions/actions.types';
import InvestigationTable from './table/investigationTable.component';
import DatafileTable from './table/datafileTable.component';
import DatasetTable from './table/datasetTable.component';
import { Link } from 'react-router-dom';

const history = createBrowserHistory();
const middleware = [thunk, routerMiddleware(history), DGTableMiddleware];

if (process.env.NODE_ENV === `development`) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const logger = (createLogger as any)();
  middleware.push(logger);
}

/* eslint-disable no-underscore-dangle, @typescript-eslint/no-explicit-any */
const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
/* eslint-enable */

const store = createStore(
  AppReducer(history),
  composeEnhancers(applyMiddleware(...middleware))
);

listenToMessages(store.dispatch);

const registerRouteAction = {
  type: RegisterRouteType,
  payload: {
    section: 'Data',
    link: '/browse/investigation',
    plugin: 'datagateway-table',
    displayName: 'DataGateway Table',
    order: 0,
    helpText: 'TODO: write some help text for the user tour',
  },
};

document.dispatchEvent(
  new CustomEvent('daaas-frontend', { detail: registerRouteAction })
);

class App extends React.Component<{}, { hasError: boolean }> {
  public constructor(props: {}) {
    super(props);
    this.state = { hasError: false };
  }

  public componentDidCatch(error: Error | null): void {
    this.setState({ hasError: true });
    log.error(`datagateway_table failed with error: ${error}`);
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
    } else
      return (
        <div className="App">
          <Provider store={store}>
            <ConnectedRouter history={history}>
              <Switch>
                <Route
                  exact
                  path="/"
                  render={() => (
                    <Link to="/browse/investigation">
                      Browse investigations
                    </Link>
                  )}
                />
                <Route
                  exact
                  path="/browse/investigation/"
                  component={InvestigationTable}
                />
                <Route
                  exact
                  path="/browse/investigation/:investigationId/dataset"
                  render={({
                    match,
                  }: RouteComponentProps<{ investigationId: string }>) => (
                    <DatasetTable
                      investigationId={match.params.investigationId}
                    />
                  )}
                />
                <Route
                  exact
                  path="/browse/investigation/:investigationId/dataset/:datasetId/datafile"
                  render={({
                    match,
                  }: RouteComponentProps<{ datasetId: string }>) => (
                    <DatafileTable datasetId={match.params.datasetId} />
                  )}
                />
              </Switch>
            </ConnectedRouter>
          </Provider>
        </div>
      );
  }
}

export default App;