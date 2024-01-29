////////////////////////////////////////////////////////////////////////////////

// IMPORTS
import _ from "lodash";
import closeImg from "url:../img/icon-close.png";
import noImg from "url:../img/icon-no-image.png";

////////////////////////////////////////////////////////////////////////////////

// VARIABLES
const body = document.querySelector("body");
const input = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-button");
const searchResults = document.querySelector(".search-results");
const pageButtonsContainer = document.querySelector(".page-buttons");
const previousBtn = document.querySelector(".previous-button");
const nextBtn = document.querySelector(".next-button");
const pageNum = document.querySelector(".page-number");

// ARRAY OF BOOKS
let books = [];

// OBJECT FOR PAGINATION
const page = {
  current: 1, // Current Page Number
  curMin: 1, // Current Min Page Number
  curMax: 5, // Current Max Page Number

  minValue: 1, // Default Min Page Number
  maxValue: 5, // Default Max Page Number

  bookIndex: 0, // Index Of The Book From Which To Start Fetching The Data
  booksLimit: 20, // Number Of Books To Fetch Per Request

  // To Calculate The Index Of The Book
  calcBookIndex() {
    this.bookIndex = 0;
    this.bookIndex += this.booksLimit * (this.current - 1);
  },

  // To Reset Current Values
  resetValues() {
    this.current = this.curMin = this.minValue;
    this.curMax = this.maxValue;
  },
};

////////////////////////////////////////////////////////////////////////////////

// FUNCTIONS
// To Create A Card
function createCard(book) {
  const key = _.get(book, "key", "");
  const cover = _.get(book, "cover_id", "");
  const title = _.get(book, "title", "");
  const authors = _.get(book, "authors", []);

  searchResults.insertAdjacentHTML(
    "beforeend",
    `
    <button class="card focus-v b-radius flex flex-cc" data-key="${key}">
      <div class="card-img-container">
        <img class="card-img" src="${
          cover ? `https://covers.openlibrary.org/b/id/${cover}-M.jpg` : noImg
        }" alt="${title}">
      </div>
      <div class="card-text dark-text word-wrap flex flex-col">
        <p class="small-text">${
          title.length > 19 ? `${title.slice(0, 19).trim()}...` : title.trim()
        }
        </p>
        <p class="author x-small-text light-text">${
          authors.map((author) => _.get(author, "name", "")).join(", ").length >
          19
            ? `${authors
                .map((author) => _.get(author, "name", ""))
                .join(", ")
                .slice(0, 19)}...`
            : `${authors.map((author) => _.get(author, "name", "")).join(", ")}`
        }
    </button>
    `
  );

  // Controlling Data For Authors
  if (authors.length === 0) {
    const cardAuthor = document.querySelector(".author");
    cardAuthor.textContent = "Unknown author";
  }
}

// To Render A Modal Of: A Card Or An Error
function renderModal(typeEl, obj) {
  // To Prevent Page From Scrolling In Background
  body.classList.add("overflow-h");

  // CARD: If typeEl Is card, The obj Is book.
  // We Render The Modal Of A Card With The Info Of The Book.
  if (typeEl === "card") {
    const cover = _.get(obj, "cover_id", "");
    const title = _.get(obj, "title", "");
    const authors = _.get(obj, "authors", []);
    const year = _.get(obj, "first_publish_year", "");
    const des = _.get(obj, "description", "");

    body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal-background w-100 flex flex-col flex-cc">
          <div class="modal-container b-radius rel flex flex-col scrollbar overflow-y">
            <div class="modal-img-container flex flex-col flex-cc">
              <div class="modal-loader hidden"></div>
              <img class="modal-img" src="${
                cover
                  ? `https://covers.openlibrary.org/b/id/${cover}-M.jpg`
                  : noImg
              }" alt="${title}">
            </div>
            <div class="modal-text dark-text flex flex-col">
              <p class="modal-title medium-text">${title}</p>
              <p class="modal-subtitle small-text light-text">${
                authors.length > 0
                  ? authors
                      .map((author) => _.get(author, "name", ""))
                      .join(", ")
                  : "Unknown author"
              }</p>
              <p class="modal-subtitle2 x-small-text light-text">
                ${year}
              </p>
            </div>
            <p class="modal-description x-small-text light-text dark-text scrollbar overflow-x-h word-wrap">
              ${des}
            </p>
            <button class="modal-button focus-v b-radius abs">
              <img class="modal-close-img" src="${closeImg}" alt="Icon to close window">
            </button>
          </div>
        </div>  
      `
    );

    const modalImage = document.querySelector(".modal-img");
    const modalDescription = document.querySelector(".modal-description");

    // Loading Spinner Waiting For Image
    toggleLoading("modal-loader");
    modalImage.addEventListener("load", () => {
      toggleLoading("modal-loader");
    });

    // Controlling Data For Description
    if (typeof des === "object") {
      modalDescription.textContent = `${_.get(des, "value", "")}`;
    }

    if (typeof des === "undefined" || des === "") {
      modalDescription.textContent = "No description available";
    }
  }

  // ERROR: If typeEl Is Error, The obj Is err.
  // We Render The Modal With An Error Message.
  if (typeEl === "error") {
    body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal-background w-100 flex flex-col flex-cc">
          <div class="error-container b-radius rel flex flex-col">
            <div class="modal-text dark-text flex flex-col">
              <p class="modal-title medium-text">ERROR 🚨</p>
              <p class="modal-subtitle small-text light-text">${obj.message}</p>
            </div>
            <button class="modal-button focus-v b-radius abs">
              <img class="modal-close-img" src="${closeImg}" alt="Icon to close window">
            </button>
          </div>
        </div>  
      `
    );
  }

  const modalSubtitle = document.querySelector(".modal-subtitle");

  // Error Message If There Is No Internet Connection
  if (obj.message === "Failed to fetch")
    modalSubtitle.textContent =
      "Connection error. Make sure you are connected to the Internet.";

  // CLOSE MODAL
  const modalBackground = document.querySelector(".modal-background");
  const modalButton = document.querySelector(".modal-button");

  // Event Listener To Close The Modal
  modalButton.addEventListener("click", () => {
    modalBackground.remove();
    body.classList.remove("overflow-h");
  });
}

// To Fetch Books
async function fetchBooks(value) {
  try {
    toggleLoading();

    value = value.trim().toLowerCase();
    if (value === "")
      throw new Error("The input is empty. Please, insert a valid book genre.");

    animateHome();

    const res = await fetch(
      `https://openlibrary.org/subjects/${value}.json?offset=${page.bookIndex}&limit=${page.booksLimit}`
    );

    if (!res.ok)
      throw new Error(
        "Error during the request of data. Refresh the page and try again. If the error persists, try again in a few hours."
      );

    const data = await res.json();

    books = _.get(data, "works", []);

    // If There Are Fewer Books Than The Limit
    if (books.length < page.booksLimit) {
      page.curMax = page.current;
    }

    // If There Are No Books In New Pages, But There Are In Previous Ones
    if (books.length === 0 && page.current !== 1)
      throw new Error(
        `Sorry, no more books found for this genre. Try with another one. :)`
      );

    // If There Are No Books At All (The Genre Is Invalid)
    if (books.length === 0)
      throw new Error(`No books found. Please, insert a valid book genre.`);

    books.map((book) => createCard(book));

    toggleLoading();
    showPageButtonsContainer();
    controlPageButtons();
  } catch (err) {
    toggleLoading();
    hidePageButtonsContainer();
    renderModal("error", err);
  }
}

// To Fetch A Book's Description
async function fetchDescription(book, key) {
  try {
    const resDes = await fetch(`https://openlibrary.org${key}.json`);

    if (!resDes.ok)
      throw new Error(
        "Error during the request of data. Refresh the page and try again. If the error persists, try again in a few hours."
      );

    const dataDes = await resDes.json();

    // Setting New Property Description For The Book Object
    book.description = _.get(dataDes, "description", "");

    renderModal("card", book);
  } catch (err) {
    renderModal("error", err);
  }
}

// To Load Books As Results
function loadBooks() {
  page.calcBookIndex();
  pageNum.textContent = `${page.current}`;
  clearResults();
  fetchBooks(input.value);
}

// To Clear Results (Both Cards And Books)
function clearResults() {
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.remove();
  });
  books = [];
}

// To Toggle The Loading Spinner
function toggleLoading(className = "loader") {
  const loader = document.querySelector(`.${className}`);
  loader.classList.toggle("hidden");
  loader.classList.toggle("loading");
}

// To Animate The Homepage A Single Time
function animateHome() {
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");

  if (header.classList.contains("header-homepage")) {
    header.classList.remove("header-homepage");
    header.classList.add("sticky");
    footer.classList.remove("footer-homepage");
    footer.classList.add("footer-margin");
  }
}

// To Show Page Buttons Container
function showPageButtonsContainer() {
  pageButtonsContainer.classList.remove("hidden");
}

// To Hide Page Buttons Container
function hidePageButtonsContainer() {
  pageButtonsContainer.classList.add("hidden");
}

// To Control Visibility Of Page Buttons
function controlPageButtons() {
  if (page.current === page.curMin && page.current !== page.curMax) {
    previousBtn.classList.add("invisible");
    nextBtn.classList.remove("invisible");
  }

  if (page.current === page.curMax && page.current !== page.curMin) {
    previousBtn.classList.remove("invisible");
    nextBtn.classList.add("invisible");
  }

  if (page.current === page.curMin && page.current === page.curMax) {
    previousBtn.classList.add("invisible");
    nextBtn.classList.add("invisible");
  }

  if (page.current !== page.curMax && page.current !== page.curMin) {
    previousBtn.classList.remove("invisible");
    nextBtn.classList.remove("invisible");
  }
}

////////////////////////////////////////////////////////////////////////////////

// EVENT LISTENERS
// To Select The Input Value Everytime There Is A Click On The Form
input.addEventListener("click", () => {
  input.select();
});

// To Search For Books (By Clicking Enter On The Keyboard)
input.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    page.resetValues();
    loadBooks();
    input.blur();
  }
});

// To Search For Books (By Clicking On The Button)
searchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  page.resetValues();
  loadBooks();
  input.blur();
});

// To Fetch The Description Of The Target Book
searchResults.addEventListener("click", (e) => {
  const card = e.target.closest(".card");

  // Controlling If The Clicked Element Is A Card
  if (!card) return;
  if (!searchResults.contains(card)) return;

  // We Filter The Books By The Key Stored In The Target Card's Dataset
  // We Fetch The Description Of The Corrisponding Book
  books.filter((book) => {
    const key = _.get(book, "key", "");
    if (key === card.dataset.key) fetchDescription(book, card.dataset.key);
  });
});

// Previous Btn: To Change Pagination
previousBtn.addEventListener("click", () => {
  if (page.current > page.curMin) {
    page.current--;
    loadBooks();
  }
});

// Next Btn: To Change Pagination
nextBtn.addEventListener("click", () => {
  if (page.current < page.curMax) {
    page.current++;
    loadBooks();
  }
});
