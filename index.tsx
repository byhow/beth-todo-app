import { html } from "@elysiajs/html";
import { Elysia, t } from "elysia";
import * as elements from "typed-html";

let lastId = 3;
const app = new Elysia()
  .use(html())
  .get("/", ({ html }) =>
    html(
      <BaseHTML>
        <body
          class="flex w-full h-screen justify-center items-center"
          hx-get="/todos"
          hx-trigger="load"
          hx-swap="innerHTML"
        ></body>
      </BaseHTML>
    )
  )
  .post("/clicked", () => (
    <div class="text-blue-500">I am from the server.</div>
  ))
  .post(
    "/todos/toggle/:id",
    ({ params }) => {
      const todo = db.find((todo) => params.id === todo.id);
      if (todo) {
        todo.completed = !todo.completed;
        return <TodoItem {...todo}></TodoItem>;
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  .get("/todos", () => <TodoList todos={db}></TodoList>)
  .delete(
    "/todos/:id",
    ({ params }) => {
      const todo = db.find((todo) => params.id === todo.id);
      if (todo) {
        db.splice(db.indexOf(todo), 1);
      }
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  .post(
    "/todos",
    ({ body }) => {
      if (body.content.length === 0) {
        throw new Error("Content cannot be empty");
      }
      const newTodo = {
        id: lastId++,
        content: body.content,
        completed: false,
      };
      db.push(newTodo);
      return newTodo;
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )
  .listen(3000);

console.log(
  `Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

const BaseHTML = ({ children }: elements.Children) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Random Webpage</title>
    <script src="https://unpkg.com/htmx.org@1.9.3"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
${children}
</html>
`;

type Todo = {
  id: number;
  content: string;
  completed: boolean;
};

const db: Todo[] = [
  { id: 1, content: "first todo", completed: false },
  { id: 2, content: "second todo", completed: true },
];

const TodoItem = ({ content, completed, id }: Todo) => {
  return (
    <div class="flex flex-row space-x-3">
      <p>{content}</p>
      <input
        type="checkbox"
        checked={completed}
        hx-post={`/todos/toggle/${id}`}
        hx-target="closest div"
        hx-swap="outerHTML"
      ></input>
      <button
        class="text-red-400"
        hx-delete={`/todos/${id}`}
        hx-target="closest div"
        hx-swap="outerHTML"
      >
        X
      </button>
    </div>
  );
};

const TodoList = ({ todos }: { todos: Todo[] }) => (
  <div>
    {todos.map((todo) => (
      <TodoItem {...todo}></TodoItem>
    ))}
    <TodoForm></TodoForm>
  </div>
);

const TodoForm = () => (
  <form class="flex flex-row space-x-3" hx-post="/todos" hx-swap="beforebegin">
    <input type="text" name="content" class="border border-b"></input>
    <button type="submit">Add</button>
  </form>
);
