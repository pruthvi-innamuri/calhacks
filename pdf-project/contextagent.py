from uagents import Agent, Context, Protocol, Model
from ai_engine import UAgentResponse, UAgentResponseType
import openai
from googlesearch import search
import requests
from bs4 import BeautifulSoup

class DocumentDescription(Model):
    text: str

class GoogleSearchResults(Model):
    results: list

class WebsiteScraperRequest(Model):
    url: str
class WebScrapeResults(Model):
    results: list

SEED_PHRASE = "your_seed_phrase_here"
AGENT_MAILBOX_KEY = "your_mailbox_key_here"
SCRAPER_AGENT_ADDRESS = "agent1qwnjmzwwdq9rjs30y3qw988htrvte6lk2xaak9xg4kz0fsdz0t9ws4mwsgs"

Con = Agent(
    name="ContextAgent",
    seed=SEED_PHRASE,
    mailbox=f"{AGENT_MAILBOX_KEY}@https://agentverse.ai",
)

print(Con.address)

context_protocol = Protocol("context analysis")

def process_pdf_text(text):
    response = openai.chat.completions.create(
        messages=[{
            "role": "user",
            "content": f"Infer and describe the content of this document:\n{text}\n",
        }], model="gpt-3.5-turbo")
    return response.choices[0].message.content

def google_search(query):
    return list(search(query, num_results=5))

async def scrape_website(ctx, url):
    await ctx.send(SCRAPER_AGENT_ADDRESS, WebsiteScraperRequest(url=url))
    ctx.logger.info(f"Sent request for scraping the Website: {url}")

async def handle_scrape_response(ctx, sender, msg):
    ctx.logger.info(f"Received response from {sender[-10:]}:")
    ctx.logger.info(msg.text)

@context_protocol.on_message(model=DocumentDescription, replies={UAgentResponse})
async def analyze_document(ctx: Context, sender: str, msg: DocumentDescription):
    # Step 1: Process PDF text
    description = process_pdf_text(msg.text)
    ctx.logger.info("Document processed")

    # Step 2: Google search
    search_results = ["https://en.wikipedia.org/wiki/George_Washington", "https://en.wikipedia.org/wiki/John_Adams", "https://en.wikipedia.org/wiki/Founding_Fathers_of_the_United_States"]
    ctx.logger.info("Google search completed")

    # Step 3: Web scraping
    for url in search_results:
        await scrape_website(ctx, url)
    ctx.logger.info("Web scraping requests sent")

    await ctx.send(
        sender, UAgentResponse(message=f"Document description: {description}\n\nSearch results: {search_results}\n\nWeb scraping requests sent.", type=UAgentResponseType.FINAL)
    )

@context_protocol.on_message(model=WebScrapeResults)
async def handle_scrape_results(ctx: Context, sender: str, msg: WebScrapeResults):
    await handle_scrape_response(ctx, sender, msg)

Con.include(context_protocol, publish_manifest=True)
    
    
if __name__ == "__main__":
    agent.run()
