import React from 'react';
import { StateType } from './state/app.types';
import { connect } from 'react-redux';

import axios from 'axios';
import { Route } from 'react-router';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

import {
  Link as MaterialLink,
  Paper,
  Breadcrumbs,
  Typography,
} from '@material-ui/core';

import {
  withStyles,
  StyleRules,
  createStyles,
  WithStyles,
} from '@material-ui/core/styles';

import ArrowTooltip from './arrowtooltip.component';

const styles = (): StyleRules =>
  createStyles({
    breadcrumb: {
      display: 'block',
      whiteSpace: 'nowrap',
      maxWidth: '20vw',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  });

interface Breadcrumb {
  id: string;
  pathName: string;
  displayName: string;
  url: string;
}

interface PageBreadcrumbsProps {
  apiUrl: string;
  location: string;
}

interface PageBreadcrumbsState {
  base: {
    entityName: string;
    displayName: string;
    url: string;
    isLast: boolean;
  };
  currentHierarchy: Breadcrumb[];
  last: {
    displayName: string;
  };
}

interface WrappedBreadcrumbProps extends WithStyles<typeof styles> {
  displayName: string;
  ariaLabel: string;
  url?: string;
  isLast?: boolean;
}

class WrappedBreadcrumb extends React.Component<
  WrappedBreadcrumbProps & WithStyles<typeof styles>
> {
  public constructor(
    props: WrappedBreadcrumbProps & WithStyles<typeof styles>
  ) {
    super(props);
  }

  public render(): React.ReactElement {
    return (
      <ArrowTooltip title={this.props.displayName}>
        {this.props.url ? (
          <MaterialLink
            component={Link}
            to={this.props.url}
            aria-label={this.props.ariaLabel}
            className={this.props.classes.breadcrumb}
          >
            {this.props.displayName}
          </MaterialLink>
        ) : (
          <Typography
            color="textPrimary"
            aria-label={this.props.ariaLabel}
            className={this.props.classes.breadcrumb}
          >
            {this.props.isLast ? (
              <i>{this.props.displayName}</i>
            ) : (
              this.props.displayName
            )}
          </Typography>
        )}
      </ArrowTooltip>
    );
  }
}

const StyledBreadcrumb = withStyles(styles)(WrappedBreadcrumb);

class PageBreadcrumbs extends React.Component<
  PageBreadcrumbsProps,
  PageBreadcrumbsState
> {
  private currentPathnames: string[];

  public constructor(props: PageBreadcrumbsProps) {
    super(props);

    // Set up pathnames and initial component state.
    this.currentPathnames = [];
    this.state = {
      base: {
        entityName: '',
        displayName: '',
        url: '',
        isLast: false,
      },
      currentHierarchy: [],
      last: {
        displayName: '',
      },
    };
  }

  public componentDidMount(): void {
    this.currentPathnames = this.props.location.split('/').filter(x => x);
    this.updateBreadcrumbState();
  }

  public componentDidUpdate(prevProps: PageBreadcrumbsProps): void {
    this.currentPathnames = this.props.location.split('/').filter(x => x);

    // If the location has changed, then update the breadcrumb state.
    if (prevProps.location !== this.props.location) {
      this.updateBreadcrumbState();
    }
  }

  private updateBreadcrumbState = async () => {
    let updatedState = this.state;

    // Update the base address if it has changed.
    const baseEntityName = this.currentPathnames[1];
    if (!(updatedState.base.entityName === baseEntityName)) {
      updatedState = {
        ...updatedState,
        base: {
          entityName: baseEntityName,
          displayName:
            `${baseEntityName}`.charAt(0).toUpperCase() +
            `${baseEntityName}s`.slice(1),
          url: `/${this.currentPathnames.slice(0, 2).join('/')}`,
          isLast: false,
        },
      };
    }

    // Set the base isLast to false unless it is proven otherwise later.
    updatedState.base.isLast = false;

    // Loop through each entry in the path name before the last.
    // We always skip 2 go ahead in steps of 2 as the we expect
    // the format to be /{entity}/{entityId}.
    let hierarchyCount = 0;
    const pathLength = this.currentPathnames.length;
    for (let index = 1; index < pathLength; index += 2) {
      // Get the entity and the data stored on the entity.
      let entity = this.currentPathnames[index];

      // Create the link to this breadcrumb which will be updated into
      // the correct object in the state.
      const link = `/${this.currentPathnames.slice(0, index + 3).join('/')}`;

      // Check we are not the end of the pathnames array.
      if (index < pathLength - 1) {
        // If the index does not already exist,
        // create the entry for the index.
        if (!updatedState.currentHierarchy[hierarchyCount]) {
          // Insert the new breadcrumb information into the array.
          updatedState.currentHierarchy.splice(hierarchyCount, 1, {
            id: '',
            pathName: entity,
            displayName: '',
            url: link,
          });
        }

        // Get the information held in the state for the current path name.
        const entityInfo = updatedState.currentHierarchy[hierarchyCount];

        // Get the entity Id in the path to compare with the saved one in our state.
        const entityId = this.currentPathnames[index + 1];

        // Check if an entity id is present or if the id has changed since the last update to the state.
        if (entityInfo.id.length === 0 || entityInfo.id !== entityId) {
          // In general the API endpoint will be our entity name and
          // the entity field we want is the NAME of the entity.
          let apiEntity = entity;
          let requestEntityField = 'NAME';

          // There are some exceptions to this when handling the DIAMOND/DLS
          // depending on if 'proposal' has been found in the current path.
          if (this.currentPathnames.includes('proposal')) {
            // If the entity is current proposal, then we will not make an API request,
            // as we need the investigation ID to retrieve the TITLE.
            if (entity === 'proposal') {
              apiEntity = 'investigation';
              requestEntityField = 'TITLE';
            } else if (entity === 'investigation') {
              // Otherwise, we can proceed and get the VISIT_ID for the investigation entity.
              requestEntityField = 'VISIT_ID';
            }
          } else {
            // Anything else (including ISIS), we request the TITLE for the investigation entity.
            if (entity === 'investigation') requestEntityField = 'TITLE';
          }

          // Create the entity url to request the name, this is pluralised to get the API endpoint.
          let requestEntityUrl;
          if (entity !== 'proposal') {
            requestEntityUrl = `${apiEntity}s`.toLowerCase() + `/${entityId}`;
          } else {
            // If we are searching for proposal, we know that there is no investigation
            // information in the current path. We will need to query and select one investigation
            // from all investigations with the entity id (which is the proposal/investigation name).
            requestEntityUrl =
              `${apiEntity}s`.toLowerCase() +
              '/findone?where=' +
              JSON.stringify({ NAME: { eq: entityId } });
          }

          // Get the entity field for the given entity request.
          let entityDisplayName = await this.getEntityInformation(
            requestEntityUrl,
            requestEntityField
          );
          if (entityDisplayName) {
            // Update the state with the new entity information.
            updatedState.currentHierarchy.splice(hierarchyCount, 1, {
              ...updatedState.currentHierarchy[hierarchyCount],

              id: entityId,
              displayName: entityDisplayName,
              url: link,
            });
          }
        }
        // Ensure that we store the last path in a separate field and that it is not the entity name.
      } else if (index === pathLength - 1) {
        if (entity !== updatedState.base.entityName) {
          // Update the state to say that e.g. if path is /browse/investigation/,
          // then display name would be just Browse > *Investigations*.
          // e.g. Browse > Investigations > *Proposal 1* (Datasets) etc.
          updatedState = {
            ...updatedState,
            last: {
              displayName:
                `${entity}`.charAt(0).toUpperCase() + `${entity}s`.slice(1),
            },
          };
        } else {
          // If the base is the current top directory, then update the last field.
          updatedState = {
            ...updatedState,
            base: {
              ...updatedState.base,

              isLast: true,
            },
          };
        }
      }

      // Increment the hierarchy count for the next entity (if there is one).
      hierarchyCount++;
    }

    // Update with final state.
    this.setState(updatedState);
  };

  private getEntityInformation = async (
    requestEntityUrl: string,
    entityField: string
  ): Promise<string> => {
    let entityName = '';
    const requestUrl = `${this.props.apiUrl}/${requestEntityUrl}`;

    // Make a GET request to the specified URL.
    entityName = await axios
      .get(requestUrl, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        // Return the property in the data received.
        return response.data[entityField];
      });

    return entityName;
  };

  public render(): React.ReactElement {
    // Filter to ensure the breadcrumbs are only for this path
    // (in the event the user moved back and changed location using the breadcrumb).
    const breadcrumbState = {
      ...this.state,
      currentHierarchy: this.state.currentHierarchy.filter(
        (value: Breadcrumb, index: number) => {
          // Return the breadcrumbs with pathnames in our current location and with the related IDs.
          // The index of the ID related to the path name is derived from the path name index add one
          // to give the ID generally and then shifted by two as this occurs every two elements.
          return (
            this.currentPathnames.includes(value.pathName) &&
            this.currentPathnames[(index + 1) * 2] === value.id
          );
        }
      ),
    };

    const hierarchyKeys = Object.keys(breadcrumbState.currentHierarchy);
    return (
      <div>
        <Paper elevation={0}>
          <Route>
            {/* // Ensure that there is a path to render, otherwise do not show any breadcrumb. */}
            {this.currentPathnames.length > 0 ? (
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="Breadcrumb"
              >
                {/* // Return the base entity as a link. */}
                {breadcrumbState.base.isLast ? (
                  <StyledBreadcrumb
                    displayName={breadcrumbState.base.displayName}
                    ariaLabel="Breadcrumb-base"
                  />
                ) : (
                  <StyledBreadcrumb
                    displayName={breadcrumbState.base.displayName}
                    ariaLabel="Breadcrumb-base"
                    url={breadcrumbState.base.url}
                  />
                )}

                {/* // Add in the hierarchy breadcrumbs. */}
                {hierarchyKeys.map((value: string, index: number) => {
                  const breadcrumbInfo =
                    breadcrumbState.currentHierarchy[index];

                  // Return the correct type of breadcrumb with the entity name
                  // depending on if it is at the end of the hierarchy or not.
                  return index + 1 === hierarchyKeys.length ? (
                    <StyledBreadcrumb
                      displayName={breadcrumbInfo.displayName}
                      ariaLabel={`Breadcrumb-hierarchy-${index + 1}`}
                      key={`breadcrumb-${index + 1}`}
                    />
                  ) : (
                    <StyledBreadcrumb
                      displayName={breadcrumbInfo.displayName}
                      ariaLabel={`Breadcrumb-hierarchy-${index + 1}`}
                      url={breadcrumbInfo.url}
                      key={`breadcrumb-${index + 1}`}
                    />
                  );
                })}

                {/* // Render the last breadcrumb information; this is the current table view. */}
                {breadcrumbState.last.displayName !== '' ? (
                  <StyledBreadcrumb
                    displayName={breadcrumbState.last.displayName}
                    ariaLabel="Breadcrumb-last"
                    isLast={true}
                  />
                ) : null}
              </Breadcrumbs>
            ) : null}
          </Route>
        </Paper>
      </div>
    );
  }
}

const mapStateToProps = (state: StateType): PageBreadcrumbsProps => ({
  apiUrl: state.dgtable.urls.apiUrl,
  location: state.router.location.pathname,
});

export default connect(mapStateToProps)(PageBreadcrumbs);
