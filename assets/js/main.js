////////////////////////////////////////////////////////////////////////////////

// IMPORTS
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

let books = [];

const page = {
  current: 1,
  minValue: 1,
  maxValue: 5,
  bookIndex: 0,
  booksLimit: 20,

  calcBookIndex() {
    this.bookIndex = 0;
    this.bookIndex += this.booksLimit * (this.current - 1);
  },
};

////////////////////////////////////////////////////////////////////////////////

// FUNCTIONS
// To Create A Card
function createCard(book) {
  searchResults.insertAdjacentHTML(
    "beforeend",
    `
    <button class="card focus-v b-radius flex flex-cc" data-key="${book.key}">
      <div class="card-img-container">
        <img class="card-img" src="${
          book.cover_id
            ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
            : noImg
        }" alt="${book.title}">
      </div>
      <div class="card-text dark-text word-wrap flex flex-col">
        <p class="small-text">${
          book.title.length > 19
            ? `${book.title.slice(0, 19).trim()}...`
            : book.title.trim()
        }
        </p>
        <p class="author x-small-text light-text">${
          book.authors.map((author) => author.name).join(", ").length > 19
            ? `${book.authors
                .map((author) => author.name)
                .join(", ")
                .slice(0, 19)}...`
            : `${book.authors.map((author) => author.name).join(", ")}`
        }
    </button>
    `
  );

  // Controlling Data For Authors
  if (book.authors.length === 0) {
    const cardAuthor = document.querySelector(".author");
    cardAuthor.textContent = "Unknown author";
  }
}

// To Render A Modal Of: A Card Or An Error
function renderModal(typeEl, obj) {
  // To Prevent Page From Scrolling In Background
  body.classList.add("overflow-h");

  // CARD
  // If typeEl Is card, The obj Is book. So We Render The Modal Of A Card With The Info Of The Book.
  if (typeEl === "card") {
    body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal-background w-100 flex flex-col flex-cc">
          <div class="modal-container b-radius rel flex flex-col scrollbar overflow-y">
            <div class="modal-img-container flex flex-col flex-cc">
              <div class="modal-loader hidden"></div>
              <img class="modal-img" src="${
                obj.cover_id
                  ? `https://covers.openlibrary.org/b/id/${obj.cover_id}-M.jpg`
                  : noImg
              }" alt="${obj.title}">
            </div>
            <div class="modal-text dark-text flex flex-col">
              <p class="modal-title medium-text">${obj.title}</p>
              <p class="modal-subtitle small-text light-text">${
                obj.authors.length > 0
                  ? obj.authors.map((author) => author.name).join(", ")
                  : "Unknown author"
              }</p>
              <p class="modal-subtitle2 x-small-text light-text">
                ${obj.first_publish_year}
              </p>
            </div>
            <p class="modal-description x-small-text light-text dark-text scrollbar overflow-x-h word-wrap">
              ${obj.description}
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
    if (typeof obj.description === "object") {
      modalDescription.textContent = `${obj.description.value}`;
    }

    if (typeof obj.description === "undefined" || obj.description === "") {
      modalDescription.textContent = "No description available";
    }
  }

  // ERROR
  // If typeEl Is Error, The obj Is err. So We Render The Modal With An Error Message.
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

  // Error Message If There Is No Internet Connection
  const modalSubtitle = document.querySelector(".modal-subtitle");

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

    books = data.works;

    if (books.length === 0)
      throw new Error(`No books found. Please, insert a valid book genre.`);

    books.map((book) => createCard(book));
    toggleLoading();
  } catch (err) {
    toggleLoading();
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

    book.description = dataDes.description;

    renderModal("card", book);
  } catch (err) {
    renderModal("error", err);
  }
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

// To Toggle The Loading Spinner
function toggleLoading(className = "loader") {
  const loader = document.querySelector(`.${className}`);
  loader.classList.toggle("hidden");
  loader.classList.toggle("loading");
}

// To Clear Results (Both Cards And Books)
function clearResults() {
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.remove();
  });
  books = [];
}

// To Load Books As Results
function loadBooks(e) {
  e.preventDefault();
  clearResults();
  fetchBooks(input.value);
  input.blur();
  page.current = page.minValue;
  showPageButtons();
  pageNum.textContent = `${page.minValue}`;
}

function loadNewPage() {
  page.calcBookIndex();
  clearResults();
  fetchBooks(input.value);
  pageNum.textContent = `${page.current}`;
  showPageButtons();
}

function showPageButtons() {
  pageButtonsContainer.classList.remove("hidden");

  if (page.current === page.minValue) {
    previousBtn.classList.add("invisible");
    nextBtn.classList.remove("invisible");
  } else if (page.current === page.maxValue) {
    previousBtn.classList.remove("invisible");
    nextBtn.classList.add("invisible");
  } else {
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
    loadBooks(e);
  }
});

// To Search For Books (By Clicking On The Button)
searchBtn.addEventListener("click", (e) => {
  loadBooks(e);
});

// To Fetch The Description Of The Target Book
searchResults.addEventListener("click", (e) => {
  const card = e.target.closest(".card");

  // Controlling If The Clicked Element Is A Card
  if (!card) return;
  if (!searchResults.contains(card)) return;

  // If It Is, We Filter The Books By The Key Stored In The Target Card's Dataset
  // Then We Fetch The Description Of The Corrisponding Book
  books.filter((book) => {
    if (book.key === card.dataset.key) fetchDescription(book, card.dataset.key);
  });
});

previousBtn.addEventListener("click", () => {
  if (page.current > 1) {
    page.current--;
    loadNewPage();
  }
});

nextBtn.addEventListener("click", () => {
  if (page.current < page.maxValue) {
    page.current++;
    loadNewPage();
  }
});
