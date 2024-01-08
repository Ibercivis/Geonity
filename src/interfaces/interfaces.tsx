export interface Project {
    id?:             number;
    creator:        number;
    administrators: number[];
    name:           string;
    description:    string;
    topic:          number[];
    hasTag:         number[];
    organizations_write:  number[];
    field_form:     CreateFieldForm;
    cover?:         string[];
    is_private?:  boolean;
    raw_password?:  string;
}

export interface ShowProject {
    id:             number;
    hasTag:         number[];
    topic:          number[];
    organizations:  OrganizationWrite[];
    creator:        number;
    administrators: number[];
    created_at?:    Date;
    updated_at?:    Date;
    name:           string;
    description:    string;
    field_form:     FieldForm;
    is_private?:    boolean;
    is_liked_by_user?: boolean;
    total_likes?:   number;
    contributions?: number;
    cover?:         Image[];
}

export interface OrganizationWrite {
    id:             number;
    principalName:  string;
}

export interface Image {
    image: string;
}

export interface FieldForm {
    id:         number,
    project:    number,
    questions:  Question[];
}

export interface CreateFieldForm {
    id?:         number,
    project?:    number,
    questions:  Question[];
}

export interface Organization {
    id:             number;
    type:           Type[];
    creator:        number;
    administrators: number[];
    members:        number[];
    principalName:  string;
    url:            string;
    description:    string;
    contactName:    string;
    contactMail:    string;
    logo:           string;
    cover:          string;
}
export interface NewOrganization {
    type:           number[];
    creator:        number;
    administrators: number[];
    members:        number[];
    principalName:  string;
    url:            string;
    description:    string;
    contactName:    string;
    contactMail:    string;
    logo?:           any;
    cover?:          any;
}

export interface Type {
    id:   number;
    type: string;
}

export interface Creator {
    id:       number;
    username: string;
}

export interface User {
    pk:         number;
    username:   string;
    email:      string;
    first_name: string;
    last_name:  string;
}

export interface Question {
    id?:            number;
    question_text:  string;
    answer_type:    string;
    mandatory?:     boolean;
}

export interface UserInfo {
    id:       number;
    username: string;
    profile:  UserProfile;
}

export interface UserProfile {
    biography:             string;
    visibility:            boolean;
    country:               Country;
    cover?:                string;
    participated_projects: CreatedProject[];
    created_projects:      CreatedProject[];
    liked_projects:        CreatedProject[];
}

export interface Country {
    code: string;
    name: string;
}

export interface CreatedProject {
    id:          number;
    name:        string;
    description: string;
}

export interface CountryData {
    abbreviation: string; 
    name: string; 
  }

export interface Observation {
    id:          number;
    creator:     number;
    field_form:  number;
    geoposition: GeoPosition;
    data:        ObservationDataForm[];
    images?:      any[];
}
export interface CreateObservation {
    field_form:  number;
    geoposition: string;
    data:        ObservationDataForm[];
    timestamp:   string
    images?:     ImageObservation[];
}

export interface ImageObservation {
    key: number;
    value: any;
}

// export interface ObervationDataForm {
//     subData: SubDataObservationDataForm[]
// }

export interface ObservationDataForm{
    key: string;
    value: string;
}

export interface Point {
    point: string;
}

export interface GeoPosition {
    srid: string;
    point: {
      longitude: number;
      latitude: number;
    };
  }

