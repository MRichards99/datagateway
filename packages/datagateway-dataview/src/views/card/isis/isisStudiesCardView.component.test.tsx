import { Link, ListItemText } from '@material-ui/core';
import { createMount, createShallow } from '@material-ui/core/test-utils';
import { push } from 'connected-react-router';
import {
  clearData,
  dGCommonInitialState,
  fetchStudiesRequest,
  filterTable,
  sortTable,
  updatePage,
} from 'datagateway-common';
import { ReactWrapper } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { StateType } from '../../../state/app.types';
import { initialState } from '../../../state/reducers/dgdataview.reducer';
import axios from 'axios';
import ISISStudiesCardView from './isisStudiesCardView.component';
import AdvancedFilter from '../advancedFilter.component';

describe('ISIS Studies - Card View', () => {
  let mount;
  let shallow;
  let mockStore;
  let store;
  let state: StateType;

  const createWrapper = (): ReactWrapper => {
    store = mockStore(state);
    return mount(
      <Provider store={store}>
        <MemoryRouter>
          <ISISStudiesCardView instrumentId="1" />
        </MemoryRouter>
      </Provider>
    );
  };

  (axios.get as jest.Mock).mockImplementation(() =>
    Promise.resolve({ data: [] })
  );
  global.Date.now = jest.fn(() => 1);
  // Prevent error logging
  window.scrollTo = jest.fn();

  beforeEach(() => {
    mount = createMount();
    shallow = createShallow();
    mockStore = configureStore([thunk]);
    state = {
      dgcommon: {
        ...dGCommonInitialState,
        totalDataCount: 1,
        data: [
          {
            ID: 1,
            STUDY_ID: 1,
            INVESTIGATION_ID: 1,
            STUDY: {
              ID: 1,
              PID: 'doi',
              NAME: 'Test 1',
              MOD_TIME: '2000-01-01',
              CREATE_TIME: '2000-01-01',
            },
          },
        ],
        allIds: [1],
      },
      dgdataview: initialState,
      router: {
        action: 'POP',
        location: {
          hash: '',
          key: '',
          pathname: '/',
          search: '',
          state: {},
        },
      },
    };
  });

  afterEach(() => {
    mount.cleanUp();
  });

  it('renders correctly', () => {
    const wrapper = shallow(
      <ISISStudiesCardView store={mockStore(state)} instrumentId="1" />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('pushFilters dispatched by date filter', () => {
    const wrapper = createWrapper();
    const advancedFilter = wrapper.find(AdvancedFilter);
    advancedFilter.find(Link).simulate('click');
    advancedFilter
      .find('input')
      .last()
      .simulate('change', { target: { value: '2019-08-06' } });

    // The push has outdated query?
    expect(store.getActions().length).toEqual(7);
    expect(store.getActions()[5]).toEqual(
      filterTable('STUDY.ENDDATE', {
        endDate: '2019-08-06',
        startDate: undefined,
      })
    );
    expect(store.getActions()[6]).toEqual(push('?'));
  });

  it('pushFilters dispatched by text filter', () => {
    const wrapper = createWrapper();
    const advancedFilter = wrapper.find(AdvancedFilter);
    advancedFilter.find(Link).simulate('click');
    advancedFilter
      .find('input')
      .first()
      .simulate('change', { target: { value: 'test' } });

    // The push has outdated query?
    expect(store.getActions().length).toEqual(7);
    expect(store.getActions()[5]).toEqual(filterTable('STUDY.NAME', 'test'));
    expect(store.getActions()[6]).toEqual(push('?'));
  });

  it('pushSort dispatched when sort button clicked', () => {
    const wrapper = createWrapper();
    const button = wrapper.find(ListItemText).first();
    expect(button.text()).toEqual('studies.name');
    button.simulate('click');

    // The push has outdated query?
    expect(store.getActions().length).toEqual(12);
    expect(store.getActions()[5]).toEqual(sortTable('STUDY.NAME', 'asc'));
    expect(store.getActions()[6]).toEqual(push('?'));
  });

  it('pushPage dispatched when page number is no longer valid', () => {
    const wrapper = createWrapper();
    store = mockStore({
      ...state,
      dgcommon: {
        ...state.dgcommon,
        totalDataCount: 1,
        query: {
          view: null,
          search: null,
          page: 2,
          results: null,
        },
      },
    });
    wrapper.setProps({ store: store });

    // The push has outdated query?
    expect(store.getActions().length).toEqual(5);
    expect(store.getActions()[0]).toEqual(updatePage(1));
    expect(store.getActions()[1]).toEqual(push('?page=2'));
  });

  // TODO: Can't trigger onChange for the Select element.
  // Had a similar issue in DG download with the new version of M-UI.
  it.todo('pushResults dispatched onChange');

  it('clearData dispatched on store update', () => {
    const wrapper = createWrapper();
    store = mockStore({
      ...state,
      dgcommon: { ...state.dgcommon, totalDataCount: 2 },
    });
    wrapper.setProps({ store: store });
    expect(store.getActions().length).toEqual(3);
    expect(store.getActions()[1]).toEqual(clearData());
    expect(store.getActions()[2]).toEqual(fetchStudiesRequest(1));
  });
});