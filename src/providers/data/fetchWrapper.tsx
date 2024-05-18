import {GraphQLFormattedError} from "graphql";

// define a custom Error type
type Error = {
    message: string;
    statusCode: string;
}

// define a customFetch fun that add authorization headers
const customFetch = async(url:string, options:RequestInit) => {
    // Retrieve access token from local storage
    const accessToken = localStorage.getItem('access_token');

    // Extract headers from options
    const headers = options.headers as Record<string, string>;

    // Perform the fetch request with added headers
    return await fetch(url, {
        ...options,
        headers: {
            ...headers,
            // Add Authorization header with the access token
            Authorization: headers?.Authorization || `Bearer ${accessToken}`,
            // set content type to JSON
            "content-type": "application/json",
            //Add apollo-require-preflight header
            // When making cross-origin requests (i.e., requests from a different origin or domain), the browser sends a preflight request to the server to determine whether the actual request is safe to send. The server then responds to the preflight request with headers indicating whether the actual request is allowed.
            "Apollo-Require-Preflight": "true"
        }
    })
}

// Define a function to extract GraphQL errors from response body
const getGraphQLErrors = (body: Record<"errors", GraphQLFormattedError[] | undefined>):
Error | null => {
    if(!body) {
        return {
            message: 'Unknown-error',
            statusCode: "INTERNAL_SERVER_ERROR"
        }
    }
    if("errors" in body) {
        const errors = body?.errors;
        const messages = errors?.map((error) => error?.message)?.join("");
        const code = errors?.[0]?.extensions?.code;
        return {
            message: messages || JSON.stringify(errors),
            statusCode: code||500
        }
    }
    return null;
}

// Define a fetchWrapper function to handle fetch requests
export const fetchWrapper = async(url:string, options:RequestInit) => {
    const response = await customFetch(url,options);
    // Clone the response for further processing
    const responseClone = response.clone();
    const body = await responseClone.json()
    const error = getGraphQLErrors(body);
    if(error){
        throw error;
    }
    return response;
}